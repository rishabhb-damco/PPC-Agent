import { Bell, RefreshCw, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useBrand } from '../context/BrandContext'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const { activeBrand, refreshBrands } = useBrand()
  const pendingCount = activeBrand?.approval_stats?.pending ?? 0

  const [time] = useState(() =>
    new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  )

  return (
    <header className="h-14 shrink-0 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 transition-colors duration-200">
      <div>
        <p className="text-sm text-gray-400">
          Last synced: <span className="text-gray-200">{time}</span>
          {activeBrand && (
            <span className="ml-2 text-xs text-blue-400 font-medium">· {activeBrand.name}</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={refreshBrands}
          className="text-gray-400 hover:text-gray-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="text-gray-400 hover:text-gray-100 transition-colors p-1 rounded-lg hover:bg-gray-800"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="relative text-gray-400 hover:text-gray-100 transition-colors">
          <Bell size={18} />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full text-black text-[9px] flex items-center justify-center font-bold">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
          RB
        </div>
      </div>
    </header>
  )
}
