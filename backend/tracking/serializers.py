from rest_framework import serializers

from .models import ApplicationTrackerEntry


class ApplicationTrackerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationTrackerEntry
        fields = "__all__"
        read_only_fields = ("user", "updated_at")

    def validate(self, attrs):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return attrs
        scholarship = attrs.get("scholarship") or getattr(
            self.instance, "scholarship", None
        )
        existing = ApplicationTrackerEntry.objects.filter(
            user=request.user, scholarship=scholarship
        )
        if self.instance is not None:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError(
                {"scholarship": "A tracker entry already exists for this scholarship."}
            )
        return attrs
