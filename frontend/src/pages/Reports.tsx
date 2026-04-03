import { useState } from 'react'
import { getWeeklyReport, getKpiScorecard, getReportsWeekly } from '../services/api'
import { FileBarChart2, Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

function ScorecardRow({ label, value, status, target }: any) {
  const cfg = {
    green: { cls: 'text-green-400', icon: CheckCircle },
    amber: { cls: 'text-yellow-400', icon: AlertTriangle },
    red: { cls: 'text-red-400', icon: XCircle },
  }
  const c = cfg[status as keyof typeof cfg] || cfg.green
  const Icon = c.icon
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
      <p className="text-sm text-gray-300">{label}</p>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">Target: {target}</span>
        <div className={`flex items-center gap-1.5 ${c.cls}`}>
          <Icon size={14} />
          <span className="text-sm font-bold">{value}</span>
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const [loading, setLoading] = useState<string | null>(null)
  const [weeklyReport, setWeeklyReport] = useState<any>(null)
  const [aiReport, setAiReport] = useState<any>(null)
  const [scorecard, setScorecard] = useState<any>(null)

  const loadWeekly = () => {
    setLoading('weekly')
    getReportsWeekly().then(r => setWeeklyReport(r.data)).catch(() => {}).finally(() => setLoading(null))
  }

  const loadAiReport = () => {
    setLoading('ai')
    getWeeklyReport().then(r => setAiReport(r.data.result)).catch(() => {}).finally(() => setLoading(null))
  }

  const loadScorecard = () => {
    setLoading('scorecard')
    getKpiScorecard().then(r => setScorecard(r.data.scorecard)).catch(() => {}).finally(() => setLoading(null))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Reports & Narrative</h1>
        <p className="text-sm text-gray-400 mt-0.5">A7 Agent — 8-stop reports · KPI scorecards · Anomalies</p>
      </div>

      <div className="flex gap-3">
        <button className="btn-primary flex items-center gap-2" onClick={loadWeekly} disabled={!!loading}>
          {loading === 'weekly' ? <Loader2 size={14} className="animate-spin" /> : <FileBarChart2 size={14} />}
          Weekly Summary
        </button>
        <button className="btn-secondary flex items-center gap-2" onClick={loadAiReport} disabled={!!loading}>
          {loading === 'ai' ? <Loader2 size={14} className="animate-spin" /> : <FileBarChart2 size={14} />}
          AI Narrative (8-Stop Report)
        </button>
        <button className="btn-secondary flex items-center gap-2" onClick={loadScorecard} disabled={!!loading}>
          {loading === 'scorecard' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          KPI Scorecard
        </button>
      </div>

      {loading && (
        <div className="card flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-blue-400" />
          <p className="text-sm text-gray-400">
            {loading === 'ai' ? 'A7 agent generating 8-stop narrative... (30–60s)' : 'Loading report...'}
          </p>
        </div>
      )}

      {/* KPI Scorecard */}
      {scorecard && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-200 mb-1">KPI Scorecard</h3>
          <p className="text-xs text-gray-500 mb-4">Green ≥ target · Amber = close · Red = below target</p>
          <ScorecardRow label="Total ROAS" value={`${scorecard.total_roas.value}x`} status={scorecard.total_roas.status} target={`${scorecard.total_roas.target}x`} />
          <ScorecardRow label="Google ROAS" value={`${scorecard.google_roas.value}x`} status={scorecard.google_roas.status} target={`${scorecard.google_roas.target}x`} />
          <ScorecardRow label="Meta ROAS" value={`${scorecard.meta_roas.value}x`} status={scorecard.meta_roas.status} target={`${scorecard.meta_roas.target}x`} />
          <ScorecardRow label="Blended CTR" value={`${scorecard.blended_ctr.value}%`} status={scorecard.blended_ctr.status} target={`${scorecard.blended_ctr.target}%`} />
          <ScorecardRow label="Total Conversions" value={scorecard.total_conversions.value} status={scorecard.total_conversions.status} target={scorecard.total_conversions.target} />
        </div>
      )}

      {/* Weekly data */}
      {weeklyReport && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-200">Weekly Summary</h3>
              <span className="text-xs text-gray-500">{weeklyReport.period}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total Spend</p>
                <p className="text-lg font-bold text-white">£{weeklyReport.kpi_summary.total_spend.toLocaleString()}</p>
                <p className={`text-xs mt-0.5 ${weeklyReport.kpi_summary.spend_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {weeklyReport.kpi_summary.spend_change_pct > 0 ? '+' : ''}{weeklyReport.kpi_summary.spend_change_pct}% vs last week
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Blended ROAS</p>
                <p className="text-lg font-bold text-white">{weeklyReport.kpi_summary.total_roas}x</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Conversions</p>
                <p className="text-lg font-bold text-white">{weeklyReport.kpi_summary.total_conversions}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Top Performing Campaigns</h3>
            {weeklyReport.top_performing_campaigns.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm text-gray-200">{c.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{c.platform}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">{c.roas}x ROAS</p>
                  <p className="text-xs text-gray-500">£{c.spend.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Narrative */}
      {aiReport && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-400">A7 — 8-Stop Performance Report</h3>
            <div className="flex items-center gap-2">
              <AlertTriangle size={12} className="text-yellow-400" />
              <span className="text-xs text-yellow-400">Requires: Client Report Final Send approval</span>
            </div>
          </div>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
            {typeof aiReport.narrative === 'string' ? aiReport.narrative : JSON.stringify(aiReport, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
