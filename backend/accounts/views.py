import os
import sys
import urllib.parse
import requests
from datetime import datetime, timedelta
from pathlib import Path

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model, login
from django.shortcuts import redirect
from django.urls import reverse
from rest_framework import viewsets
from django.views.decorators.csrf import csrf_exempt
from .models import UserProfile
from .serializers import UserProfileSerializer
from scholarships.models import Scholarship, ScholarshipEligibilityRule
from eligibility_service import (  # type: ignore
    EligibilityRuleRecord, StudentProfileRecord,
    DeterministicEligibilityEngine, CriterionStatus, OverallOutcome
)


@api_view(['GET'])
@permission_classes([AllowAny])
def google_login(request):
    """Initiate Google OAuth2 login flow."""
    client_id = os.environ.get('GOOGLE_OAUTH_CLIENT_ID', '')
    redirect_uri = os.environ.get('GOOGLE_OAUTH_REDIRECT_URI', 'http://127.0.0.1:8000/api/auth/google/callback')
    
    if not client_id:
        return Response(
            {'error': 'Google OAuth not configured'},
            status=503
        )
    
    # Build authorization URL
    params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': 'profile email',
        'access_type': 'offline',
        'prompt': 'select_account',
    }
    
    auth_url = 'https://accounts.google.com/o/oauth2/v2/auth?' + urllib.parse.urlencode(params)
    return Response({'auth_url': auth_url})


@api_view(['GET'])
@permission_classes([AllowAny])
def google_callback(request):
    """Handle Google OAuth2 callback."""
    code = request.GET.get('code')
    
    if not code:
        return Response(
            {'error': 'Authorization code not provided'},
            status=400
        )
    
    client_id = os.environ.get('GOOGLE_OAUTH_CLIENT_ID', '')
    client_secret = os.environ.get('GOOGLE_OAUTH_CLIENT_SECRET', '')
    redirect_uri = os.environ.get('GOOGLE_OAUTH_REDIRECT_URI', 'http://127.0.0.1:8000/api/auth/google/callback')
    
    # Exchange authorization code for tokens
    token_url = 'https://oauth2.googleapis.com/token'
    token_data = {
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code',
    }
    
    token_response = requests.post(token_url, data=token_data)
    
    if token_response.status_code != 200:
        return Response(
            {'error': 'Failed to exchange authorization code'},
            status=400
        )
    
    tokens = token_response.json()
    
    # Get user info with access token
    access_token = tokens.get('access_token')
    userinfo_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
    headers = {'Authorization': f'Bearer {access_token}'}
    userinfo_response = requests.get(userinfo_url, headers=headers)
    
    if userinfo_response.status_code != 200:
        return Response(
            {'error': 'Failed to fetch user information'},
            status=400
        )
    
    user_data = userinfo_response.json()
    
    # Get or create user
    email = user_data.get('email', '')
    username = email.split('@')[0] if email else user_data.get('sub', '')
    first_name = user_data.get('given_name', '')
    last_name = user_data.get('family_name', '')
    picture = user_data.get('picture', '')
    
    # Try to get existing user by email
    User = get_user_model()
    
    try:
        user = User.objects.get(email=email)
        # Update profile picture if changed
        profile, created = UserProfile.objects.get_or_create(user=user)
        if picture:
            profile.photo_url = picture
        profile.display_name = f'{first_name} {last_name}'.strip() or username
        profile.save()
    except User.DoesNotExist:
        # Create new user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=None,  # No password for OAuth users
            first_name=first_name,
            last_name=last_name,
        )
        # Create user profile
        profile = UserProfile.objects.create(
            user=user,
            display_name=f'{first_name} {last_name}'.strip() or username,
            photo_url=picture,
        )
    
    # Log in the user
    login(request, user)
    
    # Return success response with user info
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        },
        'profile': {
            'display_name': profile.display_name,
            'photo_url': profile.photo_url,
        },
        'token': request.session.session_key,
    })


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def evaluate_eligibility(request):
    """Evaluate scholarship eligibility.
    POST /api/v1/eligibility/evaluate/
    """
    scholarship_id = request.data.get('scholarship_id')
    profile_data = request.data.get('profile', {})
    rules_data = request.data.get('rules', [])
    
    try:
        scholarship = Scholarship.objects.get(slug=scholarship_id)
    except Scholarship.DoesNotExist:
        return Response(
            {'error': 'Scholarship not found'},
            status=404
        )
    
    # Build StudentProfileRecord from profile data
    profile = StudentProfileRecord(
        uid=profile_data.get('uid', ''),
        email='',
        citizenship=profile_data.get('citizenship', ''),
        residence_country=profile_data.get('residence_country', ''),
        education_level=profile_data.get('education_level', 'bachelors'),
        target_degree=profile_data.get('target_degree', 'masters'),
        institution_name=profile_data.get('institution_name', ''),
        grading_scale=profile_data.get('grading_scale', 'gpa_4_0'),
        gpa=profile_data.get('gpa'),
        max_gpa=profile_data.get('max_gpa', 4.0),
        graduation_year=profile_data.get('graduation_year', ''),
        primary_field=profile_data.get('primary_field', ''),
        work_experience_years=profile_data.get('work_experience_years', 0.0),
        english_test_type=profile_data.get('english_test_type', 'none'),
        english_score=profile_data.get('english_score'),
        has_english_medium_instruction=profile_data.get('has_english_medium_instruction', False),
        has_supervisor_contact=profile_data.get('has_supervisor_contact'),
        custom_attributes=profile_data.get('custom_attributes', {})
    )
    
    # Build EligibilityRuleRecord from rule data
    rules = []
    for rule_data in rules:
        rule = EligibilityRuleRecord(
            rule_id=rule_data.get('rule_id', ''),
            rule_type=rule_data.get('rule_type', ''),
            title=rule_data.get('title', ''),
            description=rule_data.get('description', ''),
            is_mandatory=rule_data.get('is_mandatory', True),
            source_citation=rule_data.get('source_citation', ''),
            parameters=rule_data.get('parameters', {}),
            requires_human_appraisal=rule_data.get('requires_human_appraisal', False)
        )
        rules.append(rule)
    
    # Run evaluation
    engine = DeterministicEligibilityEngine()
    evaluation = engine.evaluate(scholarship_id, rules, profile)
    
    # Serialize criteria results
    criteria_results = []
    for res in evaluation.criteria_results:
        criteria_results.append({
            'rule_id': res.rule_id,
            'rule_type': res.rule_type,
            'title': res.title,
            'status': res.status.value,
            'is_mandatory': res.is_mandatory,
            'explanation': res.explanation,
            'source_citation': res.source_citation,
            'student_value': res.student_value or '',
            'required_value': res.required_value or '',
        })
    
    # Build evaluation response
    evaluation_data = {
        'scholarship_id': evaluation.scholarship_id,
        'outcome': evaluation.outcome.value,
        'match_percentage': evaluation.match_percentage,
        'criteria_results': criteria_results,
        'summary': evaluation.summary,
        'mandatory_failed_count': evaluation.mandatory_failed_count,
        'missing_info_count': evaluation.missing_info_count,
        'manual_review_count': evaluation.manual_review_count,
        'met_criteria_count': evaluation.met_criteria_count,
        'total_criteria_count': evaluation.total_criteria_count,
    }
    
    return Response(evaluation_data)


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer