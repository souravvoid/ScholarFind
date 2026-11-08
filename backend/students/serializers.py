from rest_framework import serializers
from .models import StudentProfile, DegreeLevelChoices

class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = '__all__'
