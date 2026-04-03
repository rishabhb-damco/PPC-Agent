import { useEffect, useState } from 'react'
import { getApprovals, actionApproval, bulkActionApprovals } from '../services/api'
import { useBrand } from '../context/BrandContext'
import {
  CheckCircle, XCircle, AlertTriangle, Zap, Code2,
  Megaphone, BarChart2, Paintbrush, Loader2, CheckSquare
} from 'lucide-react'

const categoryConfig: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  google_ads: { label: 'Google Ads', icon: BarChart2, color: 'text-blue-400' },
  meta_ads: { label: 'Meta Ads', icon: Megaphone, color: 'text-purple-400' },
  technical: { label: 'Technical', icon: Code2, color: 'text-red-400' },
  creative: { label: 'Creative', icon: Paintbrush, color: 'text-pink-400' },
  strategy: { label: 'Strategy', icon: Zap, color: 'text-yellow-400' },
  reporting: { label: 'Report', icon: BarChart2, color: 'text-green-400' },
}

const impactBadge: Record<string, string> = {
  high: 'bg-red-900/40 text-red-400 border-red-800',
  medium: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  low: 'bg-gray-800 text-gray-400 border-gray-700',
}

interface ApprovalItem {
  id: string
  type: string
  category: string
  title: string
  description: string
  recommendation: string
  agent_id: string
  impact: string
  status: string
  created_at: string
}

export default function ApprovalQueue() {
  const { activeBrand } = useBrand()
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [actioning, setActioning] = useState<string | null>(null)

  const fetchItems = () => {
    setLoading(true)
    getApprovals(activeBrand?.id, filter === 'all' ? undefined : filter)
      .then(r => { setItems(r.data.items); setStats(r.data.stats) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchItems() }, [activeBrand, filter])

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setActioning(id)
    try {
      await actionApproval(id, action)
      fetchItems()
    } finally {
      setActioning(null)
    }
  }

  const handleBulk = async (action: 'approved' | 'rejected') => {
    if (!selected.size) return
    await bulkActionApprovals([...selected], action)
    setSelected(new Set())
    fetchItems()
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const pendingItems = items.filter(i => i.status === 'pending')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Approval Queue</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {activeBrand ? `${activeBrand.name} — ` : ''}AI recommendations waiting for your decision
          </p>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{selected.size} selected</span>
            <button className="btn-primary flex items-center gap-1.5 py-1.5" onClick={() => handleBulk('approved')}>
              <CheckCircle size={13} /> Approve All
            </button>
            <button className="btn-secondary flex items-center gap-1.5 py-1.5" onClick={() => handleBulk('rejected')}>
              <XCircle size={13} /> Reject All
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Pending', value: stats.pending, cls: 'text-yellow-400' },
            { label: 'High Impact', value: stats.high_impact_pending, cls: 'text-red-400' },
            { label: 'Approved', value: stats.approved, cls: 'text-green-400' },
            { label: 'Rejected', value: stats.rejected, cls: 'text-gray-400' },
          ].map(s => (
            <div key={s.label} className="card text-center py-3">
              <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {(['pending', 'all', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
        {filter === 'pending' && pendingItems.length > 0 && (
          <button
            className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200"
            onClick={() => setSelected(new Set(pendingItems.map(i => i.id)))}
          >
            <CheckSquare size={12} /> Select all pending
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      )}

      {/* Items */}
      <div className="space-y-3">
        {items.length === 0 && !loading && (
          <div className="card text-center py-10">
            <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {filter === 'pending' ? 'No pending items — all caught up!' : 'No items in this category.'}
            </p>
          </div>
        )}
        {items.map(item => {
          const cat = categoryConfig[item.category] || categoryConfig.strategy
          const CatIcon = cat.icon
          const isSelected = selected.has(item.id)
          return (
            <div
              key={item.id}
              className={`card transition-all ${isSelected ? 'border-blue-600/50 bg-blue-950/10' : ''} ${
                item.status !== 'pending' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {item.status === 'pending' && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                    className="mt-1 accent-blue-500"
                  />
                )}
                <div className={`mt-0.5 shrink-0 ${cat.color}`}>
                  <CatIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-100">{item.title}</p>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${impactBadge[item.impact]}`}>
                        {item.impact}
                      </span>
                      <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-gray-600 font-mono uppercase">{item.agent_id}</span>
                    </div>
                    {item.status !== 'pending' && (
                      <span className={`text-xs font-semibold capitalize shrink-0 ${
                        item.status === 'approved' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                  {item.recommendation && (
                    <div className="mt-2 p-2 bg-gray-800/60 rounded text-xs text-gray-300 leading-relaxed max-h-32 overflow-y-auto">
                      {item.recommendation}
                    </div>
                  )}
                  {item.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-800/50 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        onClick={() => handleAction(item.id, 'approved')}
                        disabled={actioning === item.id}
                      >
                        {actioning === item.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                        Approve
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800/50 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        onClick={() => handleAction(item.id, 'rejected')}
                        disabled={actioning === item.id}
                      >
                        <XCircle size={11} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
