import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, Share2, Search, ShieldCheck,
  Paintbrush, FileBarChart2, Zap, CheckSquare, Plus, ChevronRight, Building2,
} from 'lucide-react'
import { useBrand } from '../context/BrandContext'

const platformNav = [
  { label: 'Google Ads',       to: '/google-ads',        icon: TrendingUp   },
  { label: 'Meta Ads',         to: '/meta-ads',          icon: Share2        },
  { label: 'Research & Intel', to: '/research',          icon: Search        },
  { label: 'Technical Health', to: '/technical-health',  icon: ShieldCheck   },
  { label: 'Copy & Creative',  to: '/copy-creative',     icon: Paintbrush    },
  { label: 'Reports',          to: '/reports',           icon: FileBarChart2 },
]

const activeStyle = {
  backgroundColor: 'rgba(99,102,241,0.12)',
  border: '1px solid rgba(99,102,241,0.22)',
  color: '#FFFFFF',
}

const inactiveCls = 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'

export default function Sidebar() {
  const { brands, activeBrand, setActiveBrand } = useBrand()
  const navigate    = useNavigate()
  const totalPending = brands.reduce((sum, b) => sum + (b.approval_stats?.pending ?? 0), 0)

  return (
    <aside
      className="w-[232px] shrink-0 flex flex-col border-r"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* ── Logo ───────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 py-[18px] border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#6366F1', boxShadow: '0 2px 8px rgba(99,102,241,0.30)' }}
        >
          <Zap size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none tracking-tight">PPC Agent</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-hint)' }}>Command Centre</p>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">

        {/* Primary */}
        <div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive ? '' : inactiveCls
              }`
            }
            style={({ isActive }) => isActive ? activeStyle : undefined}
          >
            <LayoutDashboard size={15} style={{ color: 'inherit', opacity: 0.85 }} />
            Command Centre
          </NavLink>
        </div>

        {/* Clients */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: 'var(--text-hint)' }}
            >
              Clients
            </span>
            <button
              onClick={() => navigate('/brand-setup')}
              className="transition-colors rounded-md p-0.5 hover:bg-white/[0.06]"
              style={{ color: 'var(--text-hint)' }}
              title="Add client"
            >
              <Plus size={12} />
            </button>
          </div>

          {brands.length === 0 ? (
            <button
              onClick={() => navigate('/brand-setup')}
              className="flex items-center gap-2 px-3 py-2 w-full text-left text-xs rounded-lg transition-colors"
              style={{ color: 'var(--text-hint)' }}
            >
              <Plus size={11} /> Add first client
            </button>
          ) : (
            <div className="space-y-0.5">
              {brands.map(brand => {
                const isActive = activeBrand?.id === brand.id
                const pending  = brand.approval_stats?.pending ?? 0
                return (
                  <button
                    key={brand.id}
                    onClick={() => { setActiveBrand(brand); navigate('/dashboard') }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-left"
                    style={isActive
                      ? { backgroundColor: 'rgba(99,102,241,0.10)', color: '#E4E4E7' }
                      : { color: 'var(--text-muted)' }
                    }
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = '' }}
                  >
                    <Building2
                      size={12}
                      style={{ color: isActive ? '#818CF8' : 'var(--text-hint)', flexShrink: 0 }}
                    />
                    <span className="text-xs font-medium truncate flex-1">{brand.name}</span>
                    {pending > 0 && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: 'var(--warning-dim)', color: 'var(--warning)' }}
                      >
                        {pending}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Platform tools */}
        <div>
          <span
            className="block px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: 'var(--text-hint)' }}
          >
            Platform Tools
          </span>
          <div className="space-y-0.5">
            {platformNav.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive ? '' : inactiveCls
                  }`
                }
                style={({ isActive }) => isActive ? activeStyle : undefined}
              >
                <Icon size={14} style={{ opacity: 0.85 }} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Approval Queue */}
        <div>
          <NavLink
            to="/approval-queue"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive ? '' : inactiveCls
              }`
            }
            style={({ isActive }) => isActive ? activeStyle : undefined}
          >
            <CheckSquare size={14} style={{ opacity: 0.85 }} />
            <span className="flex-1">Approval Queue</span>
            {totalPending > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                style={{ backgroundColor: 'var(--warning)', color: '#09090B' }}
              >
                {totalPending > 99 ? '99+' : totalPending}
              </span>
            )}
          </NavLink>
        </div>

      </nav>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="px-2.5 py-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={() => navigate('/brand-setup')}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg transition-all duration-150"
          style={{ color: 'var(--text-hint)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#818CF8' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--text-hint)' }}
        >
          <Plus size={12} />
          <span>Add new client</span>
          <ChevronRight size={10} className="ml-auto opacity-50" />
        </button>
      </div>
    </aside>
  )
}
