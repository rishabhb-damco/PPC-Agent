import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  AlertTriangle, XCircle, Info, CheckCircle, Clock, Loader2,
  Plus, ChevronRight, Play, Zap, X, TrendingUp, Share2,
} from 'lucide-react'
import { useBrand } from '../context/BrandContext'
import {
  getDashboardOverview, getAlerts, getChartData,
  getApprovals, triggerPipeline, getAiStatus,
} from '../services/api'

// ── Helpers ──────────────────────────────────────────────────────────────────

const severityConfig: Record<string, { icon: typeof AlertTriangle; bar: string; bg: string; text: string }> = {
  critical: { icon: XCircle,      bar: 'bg-red-500',    bg: 'bg-red-950/30 border-red-800/60',    text: 'text-red-300' },
  error:    { icon: AlertTriangle, bar: 'bg-orange-500', bg: 'bg-orange-950/30 border-orange-800/60', text: 'text-orange-300' },
  warning:  { icon: AlertTriangle, bar: 'bg-yellow-500', bg: 'bg-yellow-950/30 border-yellow-800/60', text: 'text-yellow-300' },
  info:     { icon: Info,          bar: 'bg-blue-500',   bg: 'bg-blue-950/30 border-blue-800/60',  text: 'text-blue-300' },
}

const pipelineLabel: Record<string, { label: string; dot: string }> = {
  never_run: { label: 'Not analysed', dot: 'bg-gray-600' },
  running:   { label: 'Running…',     dot: 'bg-blue-400 animate-pulse' },
  completed: { label: 'Complete',     dot: 'bg-green-400' },
  error:     { label: 'Failed',       dot: 'bg-red-400' },
}

function FocusPill({ count, label, color, onClick }: { count: number; label: string; color: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
        count > 0
          ? `${color} cursor-pointer`
          : 'border-gray-800 text-gray-600 cursor-default'
      }`}
    >
      <span className={`text-base font-bold ${count > 0 ? '' : 'text-gray-700'}`}>{count}</span>
      {label}
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { brands, activeBrand, setActiveBrand, refreshBrands } = useBrand()
  const navigate = useNavigate()

  const [kpis, setKpis]           = useState<any>(null)
  const [alerts, setAlerts]       = useState<any[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [chartData, setChartData] = useState<any[]>([])
  const [approvals, setApprovals] = useState<any[]>([])
  const [runningId, setRunningId]   = useState<string | null>(null)
  const [aiStatus, setAiStatus]     = useState<any>(null)

  useEffect(() => {
    getDashboardOverview().then(r => setKpis(r.data)).catch(() => {})
    getAlerts(false).then(r => setAlerts(r.data.alerts ?? [])).catch(() => {})
    getChartData().then(r => setChartData(r.data.data ?? [])).catch(() => {})
    getApprovals(undefined, 'pending').then(r => setApprovals(r.data.items ?? [])).catch(() => {})
    getAiStatus().then(r => setAiStatus(r.data)).catch(() => {})
  }, [])

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id))

  const totalPending = brands.reduce((sum, b) => sum + (b.approval_stats?.pending ?? 0), 0)
  const highImpact   = brands.reduce((sum, b) => sum + (b.approval_stats?.high_impact_pending ?? 0), 0)
  const activeBrands = brands.length

  const handleRunPipeline = async (brandId: string) => {
    setRunningId(brandId)
    try {
      await triggerPipeline(brandId)
      refreshBrands()
    } finally {
      setRunningId(null)
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Command Centre</h1>
          <p className="text-xs text-gray-500 mt-0.5">All clients · Live overview</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => navigate('/brand-setup')}
        >
          <Plus size={13} /> Add Client
        </button>
      </div>

      {/* ── Today's Focus strip ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Today's focus:</span>
        <FocusPill
          count={visibleAlerts.filter(a => a.severity === 'critical' || a.severity === 'error').length}
          label="critical alerts"
          color="border-red-700/60 text-red-400 bg-red-950/20 hover:bg-red-950/40"
          onClick={() => document.getElementById('alert-feed')?.scrollIntoView({ behavior: 'smooth' })}
        />
        <FocusPill
          count={highImpact}
          label="high-impact approvals"
          color="border-yellow-700/60 text-yellow-400 bg-yellow-950/20 hover:bg-yellow-950/40"
          onClick={() => navigate('/approval-queue')}
        />
        <FocusPill
          count={totalPending}
          label="total pending"
          color="border-blue-700/60 text-blue-400 bg-blue-950/20 hover:bg-blue-950/40"
          onClick={() => navigate('/approval-queue')}
        />
        <FocusPill
          count={activeBrands}
          label="clients active"
          color="border-green-700/60 text-green-400 bg-green-950/20"
        />
      </div>

      {/* ── Client Performance Table ────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-200">Client Overview</h2>
          <span className="text-xs text-gray-500">{brands.length} client{brands.length !== 1 ? 's' : ''}</span>
        </div>

        {brands.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Zap size={28} className="text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400 mb-1">No clients added yet</p>
            <p className="text-xs text-gray-600 mb-4">Add a client to run competitor research, technical audit, ad copy, and more.</p>
            <button className="btn-primary mx-auto" onClick={() => navigate('/brand-setup')}>
              Add Your First Client
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-500 uppercase tracking-wider border-b border-gray-800">
                  <th className="text-left px-5 py-3">Client</th>
                  <th className="text-left px-4 py-3">Platforms</th>
                  <th className="text-left px-4 py-3">Pipeline</th>
                  <th className="text-right px-4 py-3">Pending</th>
                  <th className="text-right px-4 py-3">High Impact</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {brands.map(brand => {
                  const pl = pipelineLabel[brand.analysis_status] ?? pipelineLabel.never_run
                  const pending    = brand.approval_stats?.pending ?? 0
                  const highImpactBrand = brand.approval_stats?.high_impact_pending ?? 0
                  const isRunning  = brand.analysis_status === 'running' || runningId === brand.id
                  const isActive   = activeBrand?.id === brand.id

                  return (
                    <tr
                      key={brand.id}
                      className={`hover:bg-gray-800/40 transition-colors ${isActive ? 'bg-blue-950/10' : ''}`}
                    >
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          )}
                          <div>
                            <button
                              className="text-sm font-semibold text-gray-100 hover:text-blue-400 transition-colors text-left"
                              onClick={() => { setActiveBrand(brand); navigate('/dashboard') }}
                            >
                              {brand.name}
                            </button>
                            <p className="text-[11px] text-gray-500">{brand.industry}</p>
                          </div>
                        </div>
                      </td>

                      {/* Platforms */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {(brand.platforms ?? []).map((p: string) => (
                            <span
                              key={p}
                              className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border ${
                                p === 'google'
                                  ? 'bg-blue-950/40 text-blue-400 border-blue-800/50'
                                  : 'bg-purple-950/40 text-purple-400 border-purple-800/50'
                              }`}
                            >
                              {p === 'google' ? <TrendingUp size={9} /> : <Share2 size={9} />}
                              {p === 'google' ? 'Google' : 'Meta'}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Pipeline status */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${pl.dot}`} />
                          <span className="text-xs text-gray-400">{pl.label}</span>
                        </div>
                        {brand.last_analysed && brand.analysis_status === 'completed' && (
                          <p className="text-[10px] text-gray-600 mt-0.5 ml-4">
                            {new Date(brand.last_analysed).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </p>
                        )}
                      </td>

                      {/* Pending approvals */}
                      <td className="px-4 py-3.5 text-right">
                        {pending > 0 ? (
                          <button
                            onClick={() => { setActiveBrand(brand); navigate('/approval-queue') }}
                            className="text-sm font-bold text-yellow-400 hover:text-yellow-300 transition-colors"
                          >
                            {pending}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-600">—</span>
                        )}
                      </td>

                      {/* High impact */}
                      <td className="px-4 py-3.5 text-right">
                        {highImpactBrand > 0 ? (
                          <span className="text-sm font-bold text-red-400">{highImpactBrand}</span>
                        ) : (
                          <span className="text-sm text-gray-600">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {brand.analysis_status === 'completed' && (
                            <button
                              onClick={() => { setActiveBrand(brand); navigate('/approval-queue') }}
                              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-100 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                            >
                              Queue <ChevronRight size={11} />
                            </button>
                          )}
                          <button
                            onClick={() => handleRunPipeline(brand.id)}
                            disabled={isRunning}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-white hover:bg-blue-600 px-2.5 py-1.5 rounded-lg bg-blue-950/30 border border-blue-700/50 transition-colors disabled:opacity-50"
                          >
                            {isRunning
                              ? <><Loader2 size={11} className="animate-spin" /> Running</>
                              : <><Play size={11} /> Analyse</>
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Two-column: Alert feed + Approval preview ───────────────────── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Alert Feed */}
        <div id="alert-feed" className="col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-200">
              Alerts
              {visibleAlerts.length > 0 && (
                <span className="ml-2 text-xs text-gray-500">({visibleAlerts.length} active)</span>
              )}
            </h2>
            {dismissed.size > 0 && (
              <button
                className="text-xs text-gray-500 hover:text-gray-300"
                onClick={() => setDismissed(new Set())}
              >
                Show dismissed
              </button>
            )}
          </div>

          {visibleAlerts.length === 0 ? (
            <div className="card flex items-center gap-3 py-5">
              <CheckCircle size={18} className="text-green-400 shrink-0" />
              <div>
                <p className="text-sm text-gray-300 font-medium">No active alerts</p>
                <p className="text-xs text-gray-500">All campaigns are running normally.</p>
              </div>
            </div>
          ) : (
            visibleAlerts.map(alert => {
              const cfg = severityConfig[alert.severity] ?? severityConfig.info
              const Icon = cfg.icon
              return (
                <div key={alert.id} className={`flex items-start gap-3 p-4 rounded-xl border ${cfg.bg}`}>
                  <div className={`w-0.5 self-stretch rounded-full ${cfg.bar} shrink-0`} />
                  <Icon size={15} className={`mt-0.5 shrink-0 ${cfg.text}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${cfg.text}`}>{alert.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{alert.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-semibold uppercase text-gray-500 tracking-wide">{alert.platform}</span>
                      {alert.campaign && (
                        <span className="text-[10px] text-gray-600">· {alert.campaign}</span>
                      )}
                      <span className="text-[10px] text-gray-600">
                        {new Date(alert.timestamp).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2.5">
                      {alert.platform === 'google' && (
                        <button
                          onClick={() => navigate('/google-ads')}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                        >
                          View Google Ads
                        </button>
                      )}
                      {alert.platform === 'meta' && (
                        <button
                          onClick={() => navigate('/meta-ads')}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                        >
                          View Meta Ads
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/technical-health')}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                      >
                        Investigate
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
                    className="text-gray-600 hover:text-gray-400 transition-colors shrink-0 mt-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Approval Queue Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-200">Approval Queue</h2>
            <button
              onClick={() => navigate('/approval-queue')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              See all <ChevronRight size={11} />
            </button>
          </div>

          {approvals.length === 0 ? (
            <div className="card py-6 text-center">
              <CheckCircle size={18} className="text-green-400 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Nothing pending</p>
            </div>
          ) : (
            <>
              {approvals.slice(0, 4).map(item => (
                <div key={item.id} className="card p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-200 leading-snug">{item.title}</p>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                      item.impact === 'high'
                        ? 'bg-red-900/40 text-red-400 border-red-800'
                        : 'bg-yellow-900/40 text-yellow-400 border-yellow-800'
                    }`}>
                      {item.impact}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-950/30 px-1.5 py-0.5 rounded uppercase">{item.agent_id}</span>
                    <span className="text-[10px] text-gray-600 capitalize">{item.category.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
              {approvals.length > 4 && (
                <button
                  onClick={() => navigate('/approval-queue')}
                  className="w-full text-xs text-center text-gray-500 hover:text-blue-400 py-2 transition-colors"
                >
                  + {approvals.length - 4} more in queue
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Platform KPI strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-200">Google Ads</h3>
            <span className="ml-auto text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
              {kpis ? 'mock data' : 'loading'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Spend',    value: kpis ? `$${kpis.google_spend?.toLocaleString()}` : '—' },
              { label: 'ROAS',     value: kpis ? `${kpis.google_roas}x` : '—' },
              { label: 'Conv.',    value: kpis?.google_conversions ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] text-gray-500">{label}</p>
                <p className="text-lg font-bold text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/google-ads')}
            className="mt-4 w-full text-xs text-gray-500 hover:text-blue-400 text-left flex items-center gap-1 transition-colors"
          >
            Campaign detail <ChevronRight size={11} />
          </button>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Share2 size={14} className="text-purple-400" />
            <h3 className="text-sm font-semibold text-gray-200">Meta Ads</h3>
            <span className="ml-auto text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
              {kpis ? 'mock data' : 'loading'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Spend',   value: kpis ? `$${kpis.meta_spend?.toLocaleString()}` : '—' },
              { label: 'ROAS',    value: kpis ? `${kpis.meta_roas}x` : '—' },
              { label: 'Results', value: kpis?.meta_conversions ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] text-gray-500">{label}</p>
                <p className="text-lg font-bold text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/meta-ads')}
            className="mt-4 w-full text-xs text-gray-500 hover:text-purple-400 text-left flex items-center gap-1 transition-colors"
          >
            Campaign detail <ChevronRight size={11} />
          </button>
        </div>
      </div>

      {/* ── AI Provider Status ──────────────────────────────────────────── */}
      {aiStatus && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={13} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-200">AI Providers</h3>
            <span className="text-[10px] text-gray-500 ml-1">— which model runs each task</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(aiStatus.providers as Record<string, any>).map(([key, p]) => (
              <div key={key} className={`flex items-start gap-3 p-3 rounded-lg border ${
                p.configured
                  ? 'border-green-800/40 bg-green-950/10'
                  : 'border-gray-800 bg-gray-800/30'
              }`}>
                <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${p.configured ? 'bg-green-400' : 'bg-gray-600'}`} />
                <div className="min-w-0">
                  <p className={`text-xs font-semibold capitalize ${p.configured ? 'text-gray-100' : 'text-gray-500'}`}>
                    {key}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">{p.model}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(p.best_for as string[]).map(t => (
                      <span key={t} className="text-[9px] bg-gray-800 text-gray-500 px-1 py-0.5 rounded border border-gray-700">
                        {t}
                      </span>
                    ))}
                  </div>
                  {!p.configured && (
                    <p className="text-[9px] text-yellow-600 mt-1">Add key to .env</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 14-Day Spend Trend ──────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200">14-Day Spend Trend</h3>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Google</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />Meta</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="mSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Area type="monotone" dataKey="google_spend" name="Google $" stroke="#3b82f6" fill="url(#gSpend)" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="meta_spend"   name="Meta $"   stroke="#a855f7" fill="url(#mSpend)"  strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
