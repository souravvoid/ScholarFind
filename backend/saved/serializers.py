from rest_framework import serializers

from .models import SavedScholarship


class SavedScholarshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedScholarship
        fields = "__all__"
        read_only_fields = ("user", "saved_at", "updated_at")

    def validate(self, attrs):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return attrs
        scholarship = attrs.get("scholarship") or getattr(
            self.instance, "scholarship", None
        )
        existing = SavedScholarship.objects.filter(
            user=request.user, scholarship=scholarship
        )
        if self.instance is not None:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError(
                {"scholarship": "This scholarship is already saved."}
            )
        return attrs
