// React library imports
import React from 'react';
import ReactDOM from 'react-dom/client';

// Global styles for the application
import './index.css';

// Main App component containing the chunked file upload interface
import App from './App';

// Performance monitoring utilities (optional)
import reportWebVitals from './reportWebVitals';

/**
 * React Application Entry Point
 * 
 * This file serves as the entry point for the React application that provides
 * a user interface for uploading large files to Azure Blob Storage using
 * a chunked upload strategy.
 * 
 * The application structure:
 * - App.js: Main component with drag-and-drop file upload interface
 * - Chunked upload: Files are split into 10MB chunks for parallel upload
 * - Progress tracking: Real-time upload progress with visual feedback
 * - Error handling: User-friendly error messages for upload failures
 * 
 * The app communicates with a Django REST API backend that handles:
 * - Staging individual file chunks in Azure Blob Storage
 * - Committing all chunks as a single blob file
 */

// Create React root and mount the application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Performance monitoring - measures and reports app performance metrics
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
