import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Loader2, AlertCircle, TrendingUp, Users, Brain } from 'lucide-react'

const features = [
  { icon: TrendingUp, text: 'Live Google & Meta campaign data' },
  { icon: Brain,      text: '8-agent AI pipeline per client' },
  { icon: Users,      text: 'Multi-client command centre' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Incorrect email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#09090B' }}>

      {/* ── Left brand panel (desktop only) ──────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[44%] flex-col justify-between p-12 relative overflow-hidden border-r"
        style={{ backgroundColor: '#0C0B1F', borderColor: '#1E1B4B' }}
      >
        {/* Subtle dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#6366F1', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
            >
              <Zap size={17} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">PPC Agent</span>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-[2rem] font-bold text-white leading-tight tracking-tight">
              Every performance<br />
              decision, in one<br />
              intelligent centre.
            </h1>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: '#8B8DB8' }}>
              Monitor campaigns, analyse quality, generate copy, and act —
              across every client and platform, powered by AI.
            </p>
          </div>

          <div className="space-y-3.5">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(99,102,241,0.15)' }}
                >
                  <Icon size={12} style={{ color: '#818CF8' }} />
                </div>
                <span className="text-sm" style={{ color: '#C4C4D8' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs" style={{ color: '#3D3D5C' }}>
            Damco Digital — Internal Tool
          </p>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#6366F1' }}>
              <Zap size={15} className="text-white" />
            </div>
            <span className="text-base font-bold text-white">PPC Agent</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white tracking-tight">Welcome back</h2>
            <p className="text-sm mt-1" style={{ color: '#71717A' }}>
              Sign in to your command centre
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2.5 px-3.5 py-3 mb-5 rounded-lg text-sm"
              style={{
                backgroundColor: 'rgba(239,68,68,0.10)',
                border: '1px solid rgba(239,68,68,0.22)',
                color: '#F87171',
              }}
            >
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: '#A1A1AA' }}
              >
                Email address
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="you@agency.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: '#A1A1AA' }}
              >
                Password
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-1"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs mt-8 text-center" style={{ color: '#3F3F46' }}>
            Damco Digital — Internal Tool
          </p>
        </div>
      </div>
    </div>
  )
}
