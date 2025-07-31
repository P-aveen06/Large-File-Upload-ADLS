# Django URL routing
from django.urls import path
# Import API views for chunked file upload
from .views import StageBlockView, CommitBlockListView

"""
URL Configuration for File Upload API

This module defines the URL patterns for the chunked file upload system.
The API follows a two-phase upload process:

1. Stage Phase (/stage/): Upload individual file chunks
2. Commit Phase (/commit/): Combine all chunks into final blob

All URLs are prefixed with 'api/' from the main project URLs.
"""

urlpatterns = [
    # Stage endpoint: POST /api/stage/
    # Handles individual chunk uploads during the staging phase
    # Accepts: file chunk, block_id, filename
    # Returns: success/error response for chunk staging
    path('stage/', StageBlockView.as_view(), name='stage-block'),
    
    # Commit endpoint: POST /api/commit/
    # Handles final blob creation from all staged chunks
    # Accepts: filename, ordered list of block_ids
    # Returns: success/error response for final file creation
    path('commit/', CommitBlockListView.as_view(), name='commit-block-list'),
]
