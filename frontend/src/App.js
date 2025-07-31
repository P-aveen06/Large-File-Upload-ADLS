import React from 'react';
import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import BasePlugin from '@uppy/core/lib/BasePlugin';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Uppy styles
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB

class CustomUploader extends BasePlugin {
  constructor(uppy, opts) {
    super(uppy, opts);
    this.id = 'CustomUploader';
    this.type = 'uploader';
  }

  async uploadFile(file) {
    try {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const blockIds = [];
      const chunkPromises = [];

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.data.slice(start, end);
        const blockId = btoa(uuidv4().replace(/-/g, ''));
        blockIds.push(blockId);

        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('block_id', blockId);
        formData.append('filename', file.name);

        const promise = axios.post('http://localhost:8000/api/stage/', formData, {
          onUploadProgress: (progressEvent) => {
            const chunkProgress = progressEvent.loaded / progressEvent.total;
            const totalProgress = ((i + chunkProgress) / totalChunks) * file.size;
            this.uppy.setFileState(file.id, {
              progress: {
                bytesUploaded: totalProgress,
                bytesTotal: file.size,
              },
            });
          },
        });
        chunkPromises.push(promise);
      }

      await Promise.all(chunkPromises);

      const commitData = {
        filename: file.name,
        block_ids: blockIds,
      };

      await axios.post('http://localhost:8000/api/commit/', commitData);

      this.uppy.setFileState(file.id, {
        progress: { bytesUploaded: file.size, bytesTotal: file.size },
      });
      this.uppy.emit('upload-success', file);
    } catch (err) {
      this.uppy.emit('upload-error', file, err);
      throw err;
    }
  }

  run = (files) => {
    const promises = files.map(file => this.uploadFile(file));
    return Promise.all(promises);
  };

  install() {
    this.uppy.addUploader(this.run);
  }

  uninstall() {
    this.uppy.removeUploader(this.run);
  }
}

const uppy = new Uppy({
  autoProceed: false,
  restrictions: {
    maxNumberOfFiles: 10,
  },
});

uppy.use(CustomUploader);

function App() {
  return (
    <div className="App">
      <Dashboard
        uppy={uppy}
        proudlyDisplayPoweredByUppy={false}
        theme="dark"
      />
    </div>
  );
}

export default App;
