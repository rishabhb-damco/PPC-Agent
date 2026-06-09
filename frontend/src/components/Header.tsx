import { Bell, RefreshCw, Sun, Moon, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useBrand } from '../context/BrandContext'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { theme, toggleTheme }   = useTheme()
  const { activeBrand, refreshBrands } = useBrand()
  const { user, logout }         = useAuth()
  const pendingCount = activeBrand?.approval_stats?.pending ?? 0
  const initials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'RB'

  const [time] = useState(() =>
    new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  )

  const iconBtn = "p-1.5 rounded-lg transition-all duration-150 hover:bg-white/[0.06]"

  return (
    <header
      className="h-[52px] shrink-0 flex items-center justify-between px-6 border-b"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Left — sync time + active brand */}
      <div className="flex items-center gap-2">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Last synced: <span style={{ color: 'var(--text-secondary)' }}>{time}</span>
        </p>
        {activeBrand && (
          <>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <span
              className="text-xs font-medium"
              style={{ color: '#818CF8' }}
            >
              {activeBrand.name}
            </span>
          </>
        )}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1">

        <button
          onClick={refreshBrands}
          className={iconBtn}
          style={{ color: 'var(--text-muted)' }}
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>

        <button
          onClick={toggleTheme}
          className={iconBtn}
          style={{ color: 'var(--text-muted)' }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <button
          className={`${iconBtn} relative`}
          style={{ color: 'var(--text-muted)' }}
        >
          <Bell size={15} />
          {pendingCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-[14px] h-[14px] rounded-full text-[8px] flex items-center justify-center font-bold"
              style={{ backgroundColor: 'var(--warning)', color: '#09090B' }}
            >
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </button>

        <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--border-default)' }} />

        <button
          onClick={logout}
          className={iconBtn}
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          title="Sign out"
        >
          <LogOut size={14} />
        </button>

        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white ml-1 cursor-default"
          style={{ backgroundColor: '#6366F1' }}
          title={user?.email}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
