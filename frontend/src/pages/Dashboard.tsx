import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  AlertTriangle, XCircle, Info, CheckCircle, Clock, Loader2,
  Plus, ChevronRight, Play, Zap, X, TrendingUp, Share2, Mail,
} from 'lucide-react'
import { useBrand } from '../context/BrandContext'
import {
  getDashboardOverview, getAlerts, getChartData,
  getApprovals, triggerPipeline, getAiStatus, sendAlertSummary,
  getPacingSummary, getAllHealth,
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

function FocusPill({
  count, label, onClick,
  activeColor, activeBg, activeBorder
}: {
  count: number; label: string; onClick?: () => void
  activeColor?: string; activeBg?: string; activeBorder?: string
}) {
  const active = count > 0
  return (
    <button
      onClick={active ? onClick : undefined}
      className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150"
      style={active
        ? { backgroundColor: activeBg, border: `1px solid ${activeBorder}`, color: activeColor, cursor: 'pointer' }
        : { backgroundColor: 'transparent', border: `1px solid var(--border-default)`, color: 'var(--text-hint)', cursor: 'default' }
      }
    >
      <span className="text-sm font-bold tabular-nums">{count}</span>
      <span className="opacity-80">{label}</span>
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
  const [runningId, setRunningId]       = useState<string | null>(null)
  const [aiStatus, setAiStatus]         = useState<any>(null)
  const [pacing, setPacing]             = useState<any[]>([])
  const [healthScores, setHealthScores] = useState<Record<string, string>>({})
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent]       = useState(false)

  const handleSendAlertEmail = async () => {
    setSendingEmail(true)
    setEmailSent(false)
    try {
      await sendAlertSummary(true)
      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 4000)
    } catch { /* silent */ }
    finally { setSendingEmail(false) }
  }

  useEffect(() => {
    getDashboardOverview().then(r => setKpis(r.data)).catch(() => {})
    getAlerts(false).then(r => setAlerts(r.data.alerts ?? [])).catch(() => {})
    getChartData().then(r => setChartData(r.data.data ?? [])).catch(() => {})
    getApprovals(undefined, 'pending').then(r => setApprovals(r.data.items ?? [])).catch(() => {})
    getAiStatus().then(r => setAiStatus(r.data)).catch(() => {})
    getPacingSummary().then(r => setPacing(r.data.pacing ?? [])).catch(() => {})
    getAllHealth().then(r => {
      const map: Record<string, string> = {}
      ;(r.data.health ?? []).forEach((h: any) => { map[h.brand_id] = h.score })
      setHealthScores(map)
    }).catch(() => {})
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
    <div className="space-y-5">

      {/* ── Header + Focus strip (single row) ────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: title */}
        <div>
          <h1 className="text-lg font-bold text-white leading-none">Command Centre</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-hint)' }}>All clients · Live overview</p>
        </div>

        {/* Centre: focus pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <FocusPill
            count={visibleAlerts.filter(a => a.severity === 'critical' || a.severity === 'error').length}
            label="alerts"
            activeColor="#F87171"
            activeBg="var(--error-dim)"
            activeBorder="var(--error-border)"
            onClick={() => document.getElementById('alert-feed')?.scrollIntoView({ behavior: 'smooth' })}
          />
          <FocusPill
            count={highImpact}
            label="high-impact"
            activeColor="var(--warning)"
            activeBg="var(--warning-dim)"
            activeBorder="var(--warning-border)"
            onClick={() => navigate('/approval-queue')}
          />
          <FocusPill
            count={totalPending}
            label="pending"
            activeColor="#818CF8"
            activeBg="var(--brand-dim)"
            activeBorder="var(--brand-border)"
            onClick={() => navigate('/approval-queue')}
          />
          <FocusPill
            count={activeBrands}
            label="clients"
            activeColor="var(--success)"
            activeBg="var(--success-dim)"
            activeBorder="var(--success-border)"
          />
        </div>

        {/* Right: action */}
        <button
          className="btn-primary flex items-center gap-2 shrink-0"
          onClick={() => navigate('/brand-setup')}
        >
          <Plus size={13} /> Add Client
        </button>
      </div>

      {/* ── Client Performance Table ────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-hint)' }}>
            Client Overview
          </h2>
          <span className="text-xs" style={{ color: 'var(--text-hint)' }}>{brands.length} client{brands.length !== 1 ? 's' : ''}</span>
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
            <table className="w-full">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider border-b border-gray-800" style={{ color: 'var(--text-hint)' }}>
                  <th className="text-left px-4 py-2">Client</th>
                  <th className="text-left px-3 py-2">Platforms</th>
                  <th className="text-left px-3 py-2">Pipeline</th>
                  <th className="text-right px-3 py-2">Pending</th>
                  <th className="text-right px-3 py-2">High Impact</th>
                  <th className="text-right px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {brands.map(brand => {
                  const pl = pipelineLabel[brand.analysis_status] ?? pipelineLabel.never_run
                  const pending         = brand.approval_stats?.pending ?? 0
                  const highImpactBrand = brand.approval_stats?.high_impact_pending ?? 0
                  const isRunning = brand.analysis_status === 'running' || runningId === brand.id
                  const isActive  = activeBrand?.id === brand.id
                  const healthScore = healthScores[brand.id]
                  const pacingData  = pacing.find(p => p.brand_id === brand.id)
                  const healthDot = healthScore === 'red' ? '#F87171' : healthScore === 'amber' ? 'var(--warning)' : healthScore === 'green' ? 'var(--success)' : 'var(--text-hint)'

                  return (
                    <tr
                      key={brand.id}
                      className={`hover:bg-gray-800/40 transition-colors ${isActive ? 'bg-blue-950/10' : ''}`}
                    >
                      {/* Name */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
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
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          {(brand.platforms ?? []).map((p: string) => (
                            <span
                              key={p}
                              className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                              style={p === 'google'
                                ? { backgroundColor: 'rgba(99,102,241,0.12)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.22)' }
                                : { backgroundColor: 'rgba(168,85,247,0.10)', color: '#C084FC', border: '1px solid rgba(168,85,247,0.22)' }
                              }
                            >
                              {p === 'google' ? <TrendingUp size={8} /> : <Share2 size={8} />}
                              {p === 'google' ? 'G' : 'M'}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Health + Pacing */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: healthDot }} />
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {pacingData ? (
                              pacingData.status === 'on_pace' ? 'On pace' :
                              pacingData.status === 'over_pacing' ? `Over ${Math.abs(pacingData.variance_pct)}%` :
                              pacingData.status === 'under_pacing' ? `Under ${Math.abs(pacingData.variance_pct)}%` : 'No budget'
                            ) : pl.label}
                          </span>
                          {pacingData?.monthly_budget > 0 && (
                            <span className="text-[10px]" style={{ color: 'var(--text-hint)' }}>
                              {pacingData.currency === 'INR' ? '₹' : '$'}{(pacingData.spend_to_date || 0).toLocaleString()} / {pacingData.currency === 'INR' ? '₹' : '$'}{(pacingData.monthly_budget || 0).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Pending approvals */}
                      <td className="px-3 py-2.5 text-right">
                        {pending > 0 ? (
                          <button
                            onClick={() => { setActiveBrand(brand); navigate('/approval-queue') }}
                            className="text-xs font-bold transition-colors"
                            style={{ color: 'var(--warning)' }}
                          >
                            {pending}
                          </button>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-hint)' }}>—</span>
                        )}
                      </td>

                      {/* High impact */}
                      <td className="px-3 py-2.5 text-right">
                        {highImpactBrand > 0 ? (
                          <span className="text-xs font-bold" style={{ color: '#F87171' }}>{highImpactBrand}</span>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-hint)' }}>—</span>
                        )}
                      </td>

                      {/* Actions — single compact button */}
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {brand.analysis_status === 'completed' && (
                            <button
                              onClick={() => { setActiveBrand(brand); navigate('/approval-queue') }}
                              className="text-[11px] px-2 py-1 rounded-md transition-colors"
                              style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
                            >
                              Queue
                            </button>
                          )}
                          <button
                            onClick={() => handleRunPipeline(brand.id)}
                            disabled={isRunning}
                            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-all disabled:opacity-50"
                            style={{ color: '#818CF8', backgroundColor: 'var(--brand-dim)', border: '1px solid var(--brand-border)' }}
                          >
                            {isRunning
                              ? <><Loader2 size={10} className="animate-spin" /> Running</>
                              : <><Play size={10} /> Analyse</>
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
            <div className="flex items-center gap-2">
              {dismissed.size > 0 && (
                <button className="text-xs text-gray-500 hover:text-gray-300" onClick={() => setDismissed(new Set())}>
                  Show dismissed
                </button>
              )}
              {visibleAlerts.length > 0 && (
                <button
                  onClick={handleSendAlertEmail}
                  disabled={sendingEmail}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: emailSent ? 'var(--success-dim)' : 'var(--bg-input)',
                    border: `1px solid ${emailSent ? 'var(--success-border)' : 'var(--border-strong)'}`,
                    color: emailSent ? 'var(--success)' : 'var(--text-muted)',
                    opacity: sendingEmail ? 0.6 : 1,
                  }}
                >
                  {sendingEmail ? <Loader2 size={11} className="animate-spin" /> : <Mail size={11} />}
                  {emailSent ? 'Sent!' : sendingEmail ? 'Sending...' : 'Email summary'}
                </button>
              )}
            </div>
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
            <span
              className="ml-auto text-[10px] px-2 py-0.5 rounded-md font-medium"
              style={{
                backgroundColor: kpis?.data_source === 'live' ? 'var(--success-dim)' : 'rgba(113,113,122,0.10)',
                color: kpis?.data_source === 'live' ? 'var(--success)' : 'var(--text-hint)',
                border: `1px solid ${kpis?.data_source === 'live' ? 'var(--success-border)' : 'var(--border-default)'}`,
              }}
            >
              {kpis?.data_source === 'live' ? 'live' : kpis ? 'mock' : 'loading'}
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
            <span
              className="ml-auto text-[10px] px-2 py-0.5 rounded-md font-medium"
              style={{
                backgroundColor: kpis?.data_source === 'live' ? 'var(--success-dim)' : 'rgba(113,113,122,0.10)',
                color: kpis?.data_source === 'live' ? 'var(--success)' : 'var(--text-hint)',
                border: `1px solid ${kpis?.data_source === 'live' ? 'var(--success-border)' : 'var(--border-default)'}`,
              }}
            >
              {kpis?.data_source === 'live' ? 'live' : kpis ? 'mock' : 'loading'}
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
                    <p className="text-[9px] mt-1" style={{ color: 'var(--warning)' }}>Add key to .env</p>
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
