from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import StageBlockSerializer, CommitBlockListSerializer
from azure.storage.blob import BlobServiceClient, BlobBlock
import base64

class StageBlockView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = StageBlockSerializer(data=request.data)
        if serializer.is_valid():
            chunk = request.FILES['file']
            block_id = serializer.validated_data['block_id']
            filename = serializer.validated_data['filename']
            
            try:
                blob_service_client = BlobServiceClient(
                    account_url=settings.AZURE_STORAGE_ACCOUNT_URL,
                    credential=settings.AZURE_STORAGE_SAS_TOKEN
                )
                
                blob_client = blob_service_client.get_blob_client(
                    container=settings.AZURE_CONTAINER_NAME,
                    blob=filename
                )
                
                blob_client.stage_block(block_id=block_id, data=chunk)
                
                return Response({"message": f"Block {block_id} staged successfully"}, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CommitBlockListView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = CommitBlockListSerializer(data=request.data)
        if serializer.is_valid():
            filename = serializer.validated_data['filename']
            block_ids = serializer.validated_data['block_ids']
            
            try:
                blob_service_client = BlobServiceClient(
                    account_url=settings.AZURE_STORAGE_ACCOUNT_URL,
                    credential=settings.AZURE_STORAGE_SAS_TOKEN
                )
                
                blob_client = blob_service_client.get_blob_client(
                    container=settings.AZURE_CONTAINER_NAME,
                    blob=filename
                )
                
                block_list = [BlobBlock(block_id=block_id) for block_id in block_ids]
                blob_client.commit_block_list(block_list)
                
                return Response({"message": "File uploaded successfully"}, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
