import React from 'react';
import ReactDOM from 'react-dom/client';
import VictoriesGallery from './VictoriesGallery';
import CloudscapeBackground from './CloudscapeBackground';

// Mount 3D Victories Gallery
const victoriesMountNode = document.getElementById('victories-gallery-mount');
if (victoriesMountNode) {
  const root = ReactDOM.createRoot(victoriesMountNode);
  root.render(
    <React.StrictMode>
      <VictoriesGallery />
    </React.StrictMode>
  );
}

// Mount Global Cloudscape WebGL Shader Background for Non-Hero Sections
const cloudscapeMountNode = document.getElementById('cloudscape-bg-mount');
if (cloudscapeMountNode) {
  const root = ReactDOM.createRoot(cloudscapeMountNode);
  root.render(
    <React.StrictMode>
      <CloudscapeBackground />
    </React.StrictMode>
  );
}
