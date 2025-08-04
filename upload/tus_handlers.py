import os
from django.conf import settings
from rest_framework_tus.handlers import TusUploadHandler
from azure.storage.blob import BlobServiceClient
import logging

logger = logging.getLogger(__name__)

class AzureBlobTusUploadHandler(TusUploadHandler):
    """
    Custom TUS upload handler that uploads completed files to Azure Blob Storage
    
    This handler extends the default TUS handler to automatically upload
    completed files to Azure Blob Storage and then clean up the local temporary file.
    """
    
    def handle_upload_done(self, upload):
        """
        Called when a TUS upload is completed.
        Uploads the file to Azure Blob Storage and cleans up the local file.
        """
        try:
            # Get the uploaded file path
            file_path = upload.get_file_path()
            filename = upload.metadata.get('filename', upload.upload_id)
            
            logger.info(f"Upload completed for file: {filename}")
            
            # Initialize Azure Blob Service Client
            blob_service_client = BlobServiceClient(
                account_url=settings.AZURE_STORAGE_ACCOUNT_URL,
                credential=settings.AZURE_STORAGE_SAS_TOKEN
            )
            
            # Get blob client for the file
            blob_client = blob_service_client.get_blob_client(
                container=settings.AZURE_CONTAINER_NAME,
                blob=filename
            )
            
            # Upload the file to Azure Blob Storage
            with open(file_path, 'rb') as file_data:
                blob_client.upload_blob(file_data, overwrite=True)
            
            logger.info(f"Successfully uploaded {filename} to Azure Blob Storage")
            
            # Clean up the local temporary file
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Cleaned up local file: {file_path}")
                
        except Exception as e:
            logger.error(f"Error handling upload completion: {str(e)}")
            raise
    
    def handle_upload_error(self, upload, error):
        """
        Called when a TUS upload encounters an error.
        Clean up any temporary files.
        """
        try:
            file_path = upload.get_file_path()
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Cleaned up failed upload file: {file_path}")
        except Exception as e:
            logger.error(f"Error cleaning up failed upload: {str(e)}")
        
        super().handle_upload_error(upload, error)