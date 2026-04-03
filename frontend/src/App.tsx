import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import GoogleAds from './pages/GoogleAds'
import MetaAds from './pages/MetaAds'
import Research from './pages/Research'
import TechnicalHealth from './pages/TechnicalHealth'
import CopyCreative from './pages/CopyCreative'
import Reports from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-gray-950">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/google-ads" element={<GoogleAds />} />
              <Route path="/meta-ads" element={<MetaAds />} />
              <Route path="/research" element={<Research />} />
              <Route path="/technical-health" element={<TechnicalHealth />} />
              <Route path="/copy-creative" element={<CopyCreative />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
