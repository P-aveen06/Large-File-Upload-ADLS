from rest_framework import serializers

class StageBlockSerializer(serializers.Serializer):
    file = serializers.FileField()
    block_id = serializers.CharField()
    filename = serializers.CharField()

class CommitBlockListSerializer(serializers.Serializer):
    filename = serializers.CharField()
    block_ids = serializers.ListField(
        child=serializers.CharField()
    )
