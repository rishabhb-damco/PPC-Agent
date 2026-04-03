import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, Share2, Search, ShieldCheck,
  Paintbrush, FileBarChart2, Zap, CheckSquare,
} from 'lucide-react'
import BrandSelector from './BrandSelector'
import { useBrand } from '../context/BrandContext'

const nav = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Google Ads', to: '/google-ads', icon: TrendingUp },
  { label: 'Meta Ads', to: '/meta-ads', icon: Share2 },
  { label: 'Research & Intel', to: '/research', icon: Search },
  { label: 'Technical Health', to: '/technical-health', icon: ShieldCheck },
  { label: 'Copy & Creative', to: '/copy-creative', icon: Paintbrush },
  { label: 'Reports', to: '/reports', icon: FileBarChart2 },
]

export default function Sidebar() {
  const { activeBrand } = useBrand()
  const pendingCount = activeBrand?.approval_stats?.pending ?? 0

  return (
    <aside className="w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">PPC Agent</p>
          <p className="text-xs text-gray-500 mt-0.5">AI Agency Framework</p>
        </div>
      </div>

      {/* Brand Selector */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-800">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5 px-1">Active Brand</p>
        <BrandSelector />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="px-2 pb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Platform</p>
        {nav.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {/* Approval Queue with badge */}
        <NavLink
          to="/approval-queue"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
                : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
            }`
          }
        >
          <CheckSquare size={16} />
          <span className="flex-1">Approval Queue</span>
          {pendingCount > 0 && (
            <span className="bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {pendingCount}
            </span>
          )}
        </NavLink>
      </nav>

      {/* Agent roster summary */}
      <div className="px-4 py-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 mb-2">9-Agent Roster</p>
        <div className="flex flex-wrap gap-1">
          {['A0','A1','A2','A3','A4','A5','A6','A7'].map(a => (
            <span key={a} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">
              {a}
            </span>
          ))}
        </div>
      </div>
    </aside>
  )
}
