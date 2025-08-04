import React, { useState, useCallback } from 'react';
import * as tus from 'tus-js-client';

function App() {
  const [files, setFiles] = useState([]);
  const [uploads, setUploads] = useState({});

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const newFiles = selectedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      progress: 0,
      status: 'ready', // ready, uploading, paused, completed, error
      upload: null
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const startUpload = useCallback((fileObj) => {
    const upload = new tus.Upload(fileObj.file, {
      endpoint: 'http://localhost:8000/files/',
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: {
        filename: fileObj.file.name,
        filetype: fileObj.file.type,
      },
      onError: (error) => {
        console.error('Upload failed:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'error' }
            : f
        ));
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, progress: percentage, status: 'uploading' }
            : f
        ));
      },
      onSuccess: () => {
        console.log('Upload completed successfully');
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'completed', progress: 100 }
            : f
        ));
      }
    });

    // Store upload instance for pause/resume functionality
    setUploads(prev => ({ ...prev, [fileObj.id]: upload }));
    setFiles(prev => prev.map(f => 
      f.id === fileObj.id 
        ? { ...f, upload, status: 'uploading' }
        : f
    ));

    upload.start();
  }, []);

  const pauseUpload = (fileObj) => {
    if (uploads[fileObj.id]) {
      uploads[fileObj.id].abort();
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id 
          ? { ...f, status: 'paused' }
          : f
      ));
    }
  };

  const resumeUpload = (fileObj) => {
    if (uploads[fileObj.id]) {
      uploads[fileObj.id].start();
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id 
          ? { ...f, status: 'uploading' }
          : f
      ));
    }
  };

  const removeFile = (fileId) => {
    if (uploads[fileId]) {
      uploads[fileId].abort();
    }
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setUploads(prev => {
      const newUploads = { ...prev };
      delete newUploads[fileId];
      return newUploads;
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Resumable File Upload to Azure Blob Storage</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>

      {files.length > 0 && (
        <div>
          <h2>Files ({files.length})</h2>
          {files.map(fileObj => (
            <div
              key={fileObj.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '10px',
                backgroundColor: '#f9f9f9'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{fileObj.file.name}</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {(fileObj.file.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {fileObj.status === 'ready' && (
                    <button onClick={() => startUpload(fileObj)} style={{ padding: '5px 10px' }}>
                      Start
                    </button>
                  )}
                  {fileObj.status === 'uploading' && (
                    <button onClick={() => pauseUpload(fileObj)} style={{ padding: '5px 10px' }}>
                      Pause
                    </button>
                  )}
                  {fileObj.status === 'paused' && (
                    <button onClick={() => resumeUpload(fileObj)} style={{ padding: '5px 10px' }}>
                      Resume
                    </button>
                  )}
                  <button onClick={() => removeFile(fileObj.id)} style={{ padding: '5px 10px', backgroundColor: '#ff4444', color: 'white' }}>
                    Remove
                  </button>
                </div>
              </div>
              
              {fileObj.status !== 'ready' && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>Status: {fileObj.status}</span>
                    <span>{fileObj.progress}%</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '4px', marginTop: '5px' }}>
                    <div
                      style={{
                        width: `${fileObj.progress}%`,
                        backgroundColor: fileObj.status === 'completed' ? '#4CAF50' : '#2196F3',
                        height: '8px',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
