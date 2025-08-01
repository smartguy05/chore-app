/**
 * PWA (Progressive Web App) utility functions
 */

// Register service worker
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available, prompt user to refresh
                  if (window.confirm('A new version is available! Refresh to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Check if app is running as PWA
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// Prompt user to install PWA
export const promptInstall = () => {
  let deferredPrompt: any;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show custom install button/banner
    showInstallBanner();
  });

  const showInstallBanner = () => {
    const banner = document.createElement('div');
    banner.id = 'install-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 9999;
      animation: slideUp 0.3s ease-out;
    `;
    
    banner.innerHTML = `
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">Install Chore App</div>
        <div style="font-size: 14px; opacity: 0.9;">Add to your home screen for quick access!</div>
      </div>
      <button id="install-btn" style="
        background: white;
        color: #3b82f6;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        margin-left: 16px;
      ">Install</button>
      <button id="dismiss-btn" style="
        background: transparent;
        color: white;
        border: none;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        margin-left: 8px;
        opacity: 0.7;
      ">✕</button>
    `;

    // Add slide up animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(banner);

    // Handle install button click
    document.getElementById('install-btn')?.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
      }
      banner.remove();
    });

    // Handle dismiss button click
    document.getElementById('dismiss-btn')?.addEventListener('click', () => {
      banner.remove();
      // Store dismissal to avoid showing again for a while
      localStorage.setItem('install-banner-dismissed', Date.now().toString());
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (document.getElementById('install-banner')) {
        banner.remove();
      }
    }, 10000);
  };

  // Check if banner was recently dismissed
  const dismissed = localStorage.getItem('install-banner-dismissed');
  if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) { // 7 days
    return;
  }

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    // Hide install button if shown
    const banner = document.getElementById('install-banner');
    if (banner) {
      banner.remove();
    }
  });
};

// Enable background sync for offline actions
export const enableBackgroundSync = () => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      return registration.sync.register('background-sync-tasks');
    }).catch((error) => {
      console.log('Background sync failed:', error);
    });
  }
};

// Store offline action for later sync
export const storeOfflineAction = async (action: string, data: any) => {
  if ('caches' in window) {
    const cache = await caches.open('chore-app-offline-actions');
    const request = new Request(`/offline-action/${action}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    await cache.put(request, new Response(JSON.stringify(data)));
  }
};

// Check if user is online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Add online/offline event listeners
export const setupOnlineOfflineListeners = (onOnline?: () => void, onOffline?: () => void) => {
  window.addEventListener('online', () => {
    console.log('App is back online');
    onOnline?.();
    enableBackgroundSync();
  });

  window.addEventListener('offline', () => {
    console.log('App is offline');
    onOffline?.();
  });
};