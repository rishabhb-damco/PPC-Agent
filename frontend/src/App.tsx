import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { BrandProvider } from './context/BrandContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import GoogleAds from './pages/GoogleAds'
import MetaAds from './pages/MetaAds'
import Research from './pages/Research'
import TechnicalHealth from './pages/TechnicalHealth'
import CopyCreative from './pages/CopyCreative'
import Reports from './pages/Reports'
import BrandSetup from './pages/BrandSetup'
import ApprovalQueue from './pages/ApprovalQueue'

// BrandProvider lives here — only mounts after auth, so getBrands() never
// fires a 401-triggering request while the user is on the login page.
function AppShell() {
  return (
    <BrandProvider>
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
              <Route path="/brand-setup" element={<BrandSetup />} />
              <Route path="/approval-queue" element={<ApprovalQueue />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrandProvider>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            {/* Public — no BrandProvider, no 401 interceptor firing */}
            <Route path="/login" element={<Login />} />

            {/* Protected — BrandProvider only loads after auth confirmed */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </HashRouter>
  )
}
