# Django and DRF imports for API functionality
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# Local serializers for request validation
from .serializers import StageBlockSerializer, CommitBlockListSerializer

# Azure Storage SDK for blob operations
from azure.storage.blob import BlobServiceClient, BlobBlock
import base64

class StageBlockView(APIView):
    """
    API View for staging file chunks in Azure Blob Storage
    
    This endpoint handles the first phase of chunked file upload:
    - Receives individual file chunks from the frontend
    - Validates the chunk data and metadata
    - Stages each chunk as a block in Azure Blob Storage
    - Returns success/error response for each chunk
    
    The staging process allows for parallel chunk uploads and provides
    fault tolerance - if one chunk fails, others can continue uploading.
    
    HTTP Method: POST
    Endpoint: /api/stage/
    
    Request Data:
    - file: Binary chunk data (multipart/form-data)
    - block_id: Unique identifier for this chunk (base64 encoded)
    - filename: Target filename for the complete file
    
    Response:
    - 201: Block staged successfully
    - 400: Invalid request data
    - 500: Azure Storage error
    """
    def post(self, request, *args, **kwargs):
        # Validate incoming request data using serializer
        serializer = StageBlockSerializer(data=request.data)
        if serializer.is_valid():
            # Extract validated data
            chunk = request.FILES['file']  # Binary chunk data
            block_id = serializer.validated_data['block_id']  # Unique block identifier
            filename = serializer.validated_data['filename']  # Target filename
            
            try:
                # Initialize Azure Blob Service Client with credentials from settings
                blob_service_client = BlobServiceClient(
                    account_url=settings.AZURE_STORAGE_ACCOUNT_URL,
                    credential=settings.AZURE_STORAGE_SAS_TOKEN
                )
                
                # Get blob client for the target file in the specified container
                blob_client = blob_service_client.get_blob_client(
                    container=settings.AZURE_CONTAINER_NAME,
                    blob=filename
                )
                
                # Stage the chunk as a block in Azure Blob Storage
                # This doesn't create the final blob yet - just stages the data
                blob_client.stage_block(block_id=block_id, data=chunk)
                
                return Response(
                    {"message": f"Block {block_id} staged successfully"}, 
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                # Handle Azure Storage errors (network, authentication, quota, etc.)
                return Response(
                    {"error": str(e)}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            # Return validation errors if request data is invalid
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CommitBlockListView(APIView):
    """
    API View for committing staged blocks as a complete blob
    
    This endpoint handles the final phase of chunked file upload:
    - Receives the list of all staged block IDs for a file
    - Commits all blocks in the correct order to create the final blob
    - Validates that all required blocks are present
    - Returns success/error response for the commit operation
    
    The commit operation is atomic - either all blocks are successfully
    committed as a single blob, or the operation fails entirely.
    
    HTTP Method: POST
    Endpoint: /api/commit/
    
    Request Data:
    - filename: Target filename for the complete file
    - block_ids: Array of block IDs in the correct order
    
    Response:
    - 201: File uploaded and committed successfully
    - 400: Invalid request data or missing blocks
    - 500: Azure Storage error during commit
    
    Note: Block IDs must be provided in the same order as the original
    file chunks to ensure correct file reconstruction.
    """
    def post(self, request, *args, **kwargs):
        # Validate incoming request data using serializer
        serializer = CommitBlockListSerializer(data=request.data)
        if serializer.is_valid():
            # Extract validated data
            filename = serializer.validated_data['filename']  # Target filename
            block_ids = serializer.validated_data['block_ids']  # Ordered list of block IDs
            
            try:
                # Initialize Azure Blob Service Client with credentials from settings
                blob_service_client = BlobServiceClient(
                    account_url=settings.AZURE_STORAGE_ACCOUNT_URL,
                    credential=settings.AZURE_STORAGE_SAS_TOKEN
                )
                
                # Get blob client for the target file in the specified container
                blob_client = blob_service_client.get_blob_client(
                    container=settings.AZURE_CONTAINER_NAME,
                    blob=filename
                )
                
                # Convert block IDs to BlobBlock objects required by Azure SDK
                # The order of blocks determines the final file structure
                block_list = [BlobBlock(block_id=block_id) for block_id in block_ids]
                
                # Commit all staged blocks as a single blob
                # This creates the final file by combining all chunks in order
                blob_client.commit_block_list(block_list)
                
                return Response(
                    {"message": "File uploaded successfully"}, 
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                # Handle Azure Storage errors (missing blocks, network issues, etc.)
                return Response(
                    {"error": str(e)}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            # Return validation errors if request data is invalid
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
