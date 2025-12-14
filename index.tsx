import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Global Error Handler for Mobile Debugging
window.onerror = function (message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML += `<div style="position:fixed; top:0; left:0; width:100%; height:100%; background:white; color:red; z-index:9999; padding:20px; overflow:auto; white-space:pre-wrap;">
      <h1>Application Error</h1>
      <p>${message}</p>
      <p>${source}:${lineno}:${colno}</p>
      <p>${error?.stack || ''}</p>
    </div>`;
  }
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);