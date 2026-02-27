import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HaitiSocialApp from './pages/HaitiSocialApp'
import ErrorBoundary from './components/shared/ErrorBoundary'
import LegalPolicies from './pages/LegalPolicies'
import AppStorePreview from './pages/AppStorePreview'

// Helper utilities were removed to reduce unused-symbol lint noise. Re-add if needed later.


export default function App() {
  useEffect(() => {
    // Push notifications temporarily disabled due to VAPID key configuration issues
    // TODO: Fix VAPID key loading from environment variables
    console.log('Push notifications disabled for now');
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HaitiSocialApp />} />
          <Route path="/policies" element={<LegalPolicies />} />
          <Route path="/app-store" element={<AppStorePreview />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
