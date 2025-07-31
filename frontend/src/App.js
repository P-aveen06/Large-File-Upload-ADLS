import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB

function App() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [chunksUploaded, setChunksUploaded] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);

  useEffect(() => {
    if (totalChunks > 0) {
      setUploadProgress((chunksUploaded / totalChunks) * 100);
    }
  }, [chunksUploaded, totalChunks]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setChunksUploaded(0);

    const numChunks = Math.ceil(file.size / CHUNK_SIZE);
    setTotalChunks(numChunks);
    
    const blockIds = [];
    const uploadPromises = [];

    for (let i = 0; i < numChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const blockId = btoa(uuidv4());
      blockIds.push(blockId);

      const formData = new FormData();
      formData.append('file', chunk);
      formData.append('block_id', blockId);
      formData.append('filename', file.name);

      const promise = axios.post('http://localhost:8000/api/stage/', formData)
        .then(() => {
          setChunksUploaded(prev => prev + 1);
        });
      uploadPromises.push(promise);
    }

    try {
      await Promise.all(uploadPromises);

      const commitData = {
        filename: file.name,
        block_ids: blockIds,
      };
      
      await axios.post('http://localhost:8000/api/commit/', commitData);
      
      console.log('File uploaded successfully');
    } catch (err) {
      console.error('Error uploading file: ', err);
      setError('Error uploading file. Please try again.');
    } finally {
      setIsUploading(false);
      setTotalChunks(0);
      setChunksUploaded(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, disabled: isUploading });

  return (
    <div>
      <div {...getRootProps()} style={{ border: '2px dashed #0087F7', borderRadius: '5px', padding: '20px', textAlign: 'center', cursor: isUploading ? 'not-allowed' : 'pointer' }}>
        <input {...getInputProps()} />
        {
          isUploading ?
            <p>Uploading...</p> :
            (isDragActive ?
              <p>Drop the files here ...</p> :
              <p>Drag 'n' drop a file here, or click to select a file</p>)
        }
      </div>
      {isUploading && (
        <div style={{ marginTop: '20px' }}>
          <progress value={uploadProgress} max="100" style={{ width: '100%' }} />
          <p>{Math.round(uploadProgress)}%</p>
        </div>
      )}
      {error && (
        <div style={{ marginTop: '20px', color: 'red' }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default App;
