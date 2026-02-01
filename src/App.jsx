import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HaitiSocialApp from './pages/HaitiSocialApp'
import ErrorBoundary from './components/shared/ErrorBoundary'
import LegalPolicies from './pages/LegalPolicies'
import axios from "axios";

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/notification-sw.js')
        .then(reg => {
          Notification.requestPermission()
            .then(permission => {
              if (permission === 'granted') {
                const vapidPublicKey = import.meta.env.VITE_PUSH_VAPID_PUBLIC_KEY || '';
                if (!vapidPublicKey) {
                  console.error('VAPID public key missing');
                  alert('Push notifications are not available: VAPID public key is missing. Please contact the site administrator.');
                  return;
                }
                reg.pushManager.getSubscription()
                  .then(sub => {
                    if (!sub) {
                      reg.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                      })
                        .then(newSub => {
                          const userId = window.localStorage.getItem('userId');
                          axios.post(`${import.meta.env.VITE_API_BASE_URL || ''}/subscriptions`, {
                            userId,
                            subscription: newSub
                          })
                            .then(() => {
                              console.log('Push subscription saved to backend');
                            })
                            .catch(err => {
                              console.error('Failed to save push subscription to backend:', err);
                            });
                        })
                        .catch(err => {
                          console.error('PushManager.subscribe failed:', err);
                        });
                    }
                  })
                  .catch(err => {
                    console.error('PushManager.getSubscription failed:', err);
                  });
              } else {
                console.warn('Notification permission not granted:', permission);
              }
            })
            .catch(err => {
              console.error('Notification.requestPermission failed:', err);
            });
        })
        .catch(err => {
          console.error('Service worker registration failed:', err);
        });
    }
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HaitiSocialApp />} />
          <Route path="/policies" element={<LegalPolicies />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}