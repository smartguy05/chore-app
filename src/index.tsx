import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { registerServiceWorker, promptInstall, setupOnlineOfflineListeners } from './utils/pwaUtils';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker and setup PWA features
registerServiceWorker();
promptInstall();
setupOnlineOfflineListeners(); 