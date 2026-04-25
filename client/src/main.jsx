import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';
import './index.css';
import App from './App.jsx';

// Register service worker
registerSW({
  onOfflineReady() {
    toast.success('App ready to work offline', {
      description: 'You can now access your data without an internet connection.',
      duration: 5000,
    });
  },
  onNeedRefresh() {
    // With autoUpdate, this might not be called, but good to have
    toast.info('New content available', {
      action: {
        label: 'Reload',
        onClick: () => window.location.reload(),
      },
    });
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
