import { useBrand } from '../context/BrandContext'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronDown, Loader2, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

const statusIcon = {
  never_run: <Clock size={10} className="text-gray-500" />,
  running: <Loader2 size={10} className="text-blue-400 animate-spin" />,
  completed: <CheckCircle size={10} className="text-green-400" />,
  error: <AlertTriangle size={10} className="text-red-400" />,
}

export default function BrandSelector() {
  const { brands, activeBrand, setActiveBrand } = useBrand()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          {activeBrand ? (
            <>
              <p className="text-xs font-semibold text-gray-100 truncate">{activeBrand.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{activeBrand.industry}</p>
            </>
          ) : (
            <p className="text-xs text-gray-500">Select a brand</p>
          )}
        </div>
        <ChevronDown size={12} className="text-gray-500 shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {brands.map(b => (
            <button
              key={b.id}
              onClick={() => { setActiveBrand(b); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-700 transition-colors ${activeBrand?.id === b.id ? 'bg-blue-900/30' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-200 truncate">{b.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {statusIcon[b.analysis_status as keyof typeof statusIcon]}
                  <span className="text-[10px] text-gray-500 capitalize">{b.analysis_status.replace('_', ' ')}</span>
                  {(b.approval_stats?.pending ?? 0) > 0 && (
                    <span className="ml-1 text-[9px] bg-yellow-900/50 text-yellow-400 px-1 py-0.5 rounded">
                      {b.approval_stats?.pending} pending
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
          <button
            onClick={() => { navigate('/brand-setup'); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-blue-400 hover:bg-gray-700 border-t border-gray-700 transition-colors"
          >
            <Plus size={12} />
            <span className="text-xs font-medium">Add New Brand</span>
          </button>
        </div>
      )}
    </div>
  )
}
