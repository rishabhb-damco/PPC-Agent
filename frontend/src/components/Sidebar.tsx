import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, Share2, Search, ShieldCheck,
  Paintbrush, FileBarChart2, Zap, CheckSquare, Plus,
  ChevronRight, Building2,
} from 'lucide-react'
import { useBrand } from '../context/BrandContext'

const platformNav = [
  { label: 'Google Ads',      to: '/google-ads',       icon: TrendingUp },
  { label: 'Meta Ads',        to: '/meta-ads',         icon: Share2 },
  { label: 'Research & Intel', to: '/research',        icon: Search },
  { label: 'Technical Health', to: '/technical-health', icon: ShieldCheck },
  { label: 'Copy & Creative', to: '/copy-creative',    icon: Paintbrush },
  { label: 'Reports',         to: '/reports',          icon: FileBarChart2 },
]

export default function Sidebar() {
  const { brands, activeBrand, setActiveBrand } = useBrand()
  const navigate = useNavigate()
  const totalPending = brands.reduce((sum, b) => sum + (b.approval_stats?.pending ?? 0), 0)

  return (
    <aside className="w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">PPC Agent</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Command Centre</p>
        </div>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">

        {/* Command Centre */}
        <div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
              }`
            }
          >
            <LayoutDashboard size={16} />
            Command Centre
          </NavLink>
        </div>

        {/* Clients section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Clients</p>
            <button
              onClick={() => navigate('/brand-setup')}
              className="text-gray-600 hover:text-blue-400 transition-colors"
              title="Add client"
            >
              <Plus size={12} />
            </button>
          </div>

          {brands.length === 0 ? (
            <button
              onClick={() => navigate('/brand-setup')}
              className="flex items-center gap-2 px-3 py-2 w-full text-left text-xs text-gray-600 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Plus size={12} /> Add first client
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
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left group ${
                      isActive
                        ? 'bg-gray-800 text-gray-100'
                        : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800/60'
                    }`}
                  >
                    <Building2 size={13} className={isActive ? 'text-blue-400' : 'text-gray-600 group-hover:text-gray-400'} />
                    <span className="text-xs font-medium truncate flex-1">{brand.name}</span>
                    {pending > 0 && (
                      <span className="text-[9px] font-bold bg-yellow-900/60 text-yellow-400 px-1.5 py-0.5 rounded-full shrink-0">
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
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-2 mb-1.5">Platform Tools</p>
          <div className="space-y-0.5">
            {platformNav.map(({ label, to, icon: Icon }) => (
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
                <Icon size={15} />
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
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
              }`
            }
          >
            <CheckSquare size={15} />
            <span className="flex-1">Approval Queue</span>
            {totalPending > 0 && (
              <span className="bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {totalPending > 99 ? '99+' : totalPending}
              </span>
            )}
          </NavLink>
        </div>

      </nav>

      {/* Bottom: Add client shortcut */}
      <div className="px-3 py-3 border-t border-gray-800">
        <button
          onClick={() => navigate('/brand-setup')}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-500 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Plus size={13} />
          <span>Add new client</span>
          <ChevronRight size={11} className="ml-auto" />
        </button>
      </div>

    </aside>
  )
}
