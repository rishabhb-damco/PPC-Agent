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
        style={{ backgroundColor: '#13114A', borderColor: '#2D2A72' }}
      >
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(165,169,252,0.20) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Radial glow from bottom */}
        <div
          className="absolute -bottom-24 -left-24 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#6366F1', boxShadow: '0 4px 16px rgba(99,102,241,0.45)' }}
            >
              <Zap size={17} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: '#FFFFFF' }}>PPC Agent</span>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1
              className="text-[2rem] font-bold leading-tight tracking-tight"
              style={{ color: '#FFFFFF' }}
            >
              Every performance<br />
              decision, in one<br />
              intelligent centre.
            </h1>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: '#C4C6E8' }}>
              Monitor campaigns, analyse quality, generate copy, and act —
              across every client and platform, powered by AI.
            </p>
          </div>

          <div className="space-y-3.5">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(165,169,252,0.20)' }}
                >
                  <Icon size={12} style={{ color: '#A5B4FC' }} />
                </div>
                <span className="text-sm" style={{ color: '#D8DAF0' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs" style={{ color: '#6B6D9E' }}>
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
