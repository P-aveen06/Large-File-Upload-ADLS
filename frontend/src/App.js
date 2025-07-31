// React imports for component functionality and hooks
import React, { useCallback, useState, useEffect } from 'react';
// Drag and drop file upload library
import { useDropzone } from 'react-dropzone';
// HTTP client for API requests
import axios from 'axios';
// UUID generator for unique block identifiers
import { v4 as uuidv4 } from 'uuid';

// Configuration: Chunk size for file splitting (10MB chunks for optimal upload performance)
const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Main App Component - Large File Upload with Chunking
 * 
 * This component provides a drag-and-drop interface for uploading large files
 * to Azure Blob Storage using a chunked upload strategy. Files are split into
 * smaller chunks, uploaded in parallel, and then committed as a single blob.
 * 
 * Features:
 * - Drag and drop file selection
 * - Chunked upload for large files
 * - Real-time progress tracking
 * - Error handling and user feedback
 * - Parallel chunk upload for better performance
 */
function App() {
  // State management for upload progress and status
  const [uploadProgress, setUploadProgress] = useState(0); // Progress percentage (0-100)
  const [error, setError] = useState(null); // Error message display
  const [isUploading, setIsUploading] = useState(false); // Upload status flag
  const [chunksUploaded, setChunksUploaded] = useState(0); // Number of chunks successfully uploaded
  const [totalChunks, setTotalChunks] = useState(0); // Total number of chunks for current file

  /**
   * Effect hook to calculate and update upload progress
   * Recalculates progress percentage whenever chunks are uploaded
   */
  useEffect(() => {
    if (totalChunks > 0) {
      setUploadProgress((chunksUploaded / totalChunks) * 100);
    }
  }, [chunksUploaded, totalChunks]);

  /**
   * File drop handler - Main upload logic
   * 
   * This function handles the entire chunked upload process:
   * 1. Splits the file into chunks of CHUNK_SIZE
   * 2. Generates unique block IDs for each chunk
   * 3. Uploads all chunks in parallel to the staging endpoint
   * 4. Commits all chunks as a single blob
   * 
   * @param {File[]} acceptedFiles - Array of files dropped by user
   */
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Initialize upload state
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setChunksUploaded(0);

    // Calculate number of chunks needed based on file size
    const numChunks = Math.ceil(file.size / CHUNK_SIZE);
    setTotalChunks(numChunks);
    
    // Arrays to store block IDs and upload promises for parallel processing
    const blockIds = [];
    const uploadPromises = [];

    // Create and upload each chunk
    for (let i = 0; i < numChunks; i++) {
      // Calculate chunk boundaries
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      // Generate unique base64-encoded block ID for Azure Blob Storage
      const blockId = btoa(uuidv4());
      blockIds.push(blockId);

      // Prepare form data for chunk upload
      const formData = new FormData();
      formData.append('file', chunk);
      formData.append('block_id', blockId);
      formData.append('filename', file.name);

      // Create upload promise for this chunk
      const promise = axios.post('http://localhost:8000/api/stage/', formData)
        .then(() => {
          // Update progress counter when chunk upload completes
          setChunksUploaded(prev => prev + 1);
        });
      uploadPromises.push(promise);
    }

    try {
      // Wait for all chunks to upload in parallel
      await Promise.all(uploadPromises);

      // Prepare commit data with all block IDs
      const commitData = {
        filename: file.name,
        block_ids: blockIds,
      };
      
      // Commit all chunks as a single blob in Azure Storage
      await axios.post('http://localhost:8000/api/commit/', commitData);
      
      console.log('File uploaded successfully');
    } catch (err) {
      // Handle upload errors
      console.error('Error uploading file: ', err);
      setError('Error uploading file. Please try again.');
    } finally {
      // Reset upload state regardless of success or failure
      setIsUploading(false);
      setTotalChunks(0);
      setChunksUploaded(0);
    }
  }, []);

  // Configure dropzone with upload handler and disable during upload
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    disabled: isUploading 
  });

  return (
    <div>
      {/* File drop zone with visual feedback */}
      <div 
        {...getRootProps()} 
        style={{ 
          border: '2px dashed #0087F7', 
          borderRadius: '5px', 
          padding: '20px', 
          textAlign: 'center', 
          cursor: isUploading ? 'not-allowed' : 'pointer' 
        }}
      >
        <input {...getInputProps()} />
        {
          isUploading ?
            <p>Uploading...</p> :
            (isDragActive ?
              <p>Drop the files here ...</p> :
              <p>Drag 'n' drop a file here, or click to select a file</p>)
        }
      </div>
      
      {/* Progress bar - shown only during upload */}
      {isUploading && (
        <div style={{ marginTop: '20px' }}>
          <progress value={uploadProgress} max="100" style={{ width: '100%' }} />
          <p>{Math.round(uploadProgress)}%</p>
        </div>
      )}
      
      {/* Error message display */}
      {error && (
        <div style={{ marginTop: '20px', color: 'red' }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default App;
