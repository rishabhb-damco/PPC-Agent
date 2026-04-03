import { Bell, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const [time] = useState(() =>
    new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  )

  return (
    <header className="h-14 shrink-0 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      <div>
        <p className="text-sm text-gray-400">
          Last synced: <span className="text-gray-200">{time}</span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button className="text-gray-400 hover:text-gray-100 transition-colors">
          <RefreshCw size={16} />
        </button>
        <button className="relative text-gray-400 hover:text-gray-100 transition-colors">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
            4
          </span>
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
          RB
        </div>
      </div>
    </header>
  )
}
