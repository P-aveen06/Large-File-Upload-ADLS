# Django REST Framework serializers for request validation
from rest_framework import serializers

class StageBlockSerializer(serializers.Serializer):
    """
    Serializer for validating chunk staging requests
    
    This serializer validates the data sent to the StageBlockView endpoint
    during the first phase of chunked file upload. It ensures that all
    required fields are present and properly formatted before attempting
    to stage a chunk in Azure Blob Storage.
    
    Fields:
    - file: The binary chunk data (uploaded as multipart/form-data)
    - block_id: Unique identifier for this chunk (base64 encoded UUID)
    - filename: The target filename for the complete assembled file
    
    Validation ensures:
    - File data is present and valid
    - Block ID is a non-empty string
    - Filename is a non-empty string
    """
    file = serializers.FileField()  # Binary chunk data from multipart upload
    block_id = serializers.CharField()  # Unique block identifier (base64 encoded)
    filename = serializers.CharField()  # Target filename for the complete file

class CommitBlockListSerializer(serializers.Serializer):
    """
    Serializer for validating block commit requests
    
    This serializer validates the data sent to the CommitBlockListView endpoint
    during the final phase of chunked file upload. It ensures that the filename
    and list of block IDs are properly formatted before attempting to commit
    all staged blocks as a single blob in Azure Blob Storage.
    
    Fields:
    - filename: The target filename for the complete assembled file
    - block_ids: Ordered list of block IDs that should be committed together
    
    Validation ensures:
    - Filename is a non-empty string
    - Block IDs list is present and contains string elements
    - Each block ID in the list is a valid string
    
    Note: The order of block_ids is critical as it determines how the
    chunks are assembled into the final file. They must be in the same
    order as the original file chunks.
    """
    filename = serializers.CharField()  # Target filename for the complete file
    block_ids = serializers.ListField(
        child=serializers.CharField()  # Each block ID must be a string
    )  # Ordered list of block IDs to commit
