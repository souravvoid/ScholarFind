from rest_framework import serializers
from .models import (
    ScholarshipProvider, ScholarshipSource, Scholarship,
    ScholarshipEligibilityRule, RequiredDocument, IngestionJob
)

class ScholarshipProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScholarshipProvider
        fields = '__all__'

class ScholarshipSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScholarshipSource
        fields = '__all__'

class ScholarshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scholarship
        fields = '__all__'

class ScholarshipEligibilityRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScholarshipEligibilityRule
        fields = '__all__'

class RequiredDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequiredDocument
        fields = '__all__'

class IngestionJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = IngestionJob
        fields = '__all__'
