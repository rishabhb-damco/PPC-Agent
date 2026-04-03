import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import KPICard from '../components/KPICard'
import AlertBanner from '../components/AlertBanner'
import AgentStatusPanel from '../components/AgentStatusPanel'
import { getDashboardOverview, getAlerts, getChartData, getBrandAnalysis, triggerPipeline } from '../services/api'
import { useBrand } from '../context/BrandContext'
import { useNavigate } from 'react-router-dom'
import {
  Zap, Loader2, CheckCircle, Clock, AlertTriangle,
  Play, ChevronRight, Search, Shield, Paintbrush, FileText
} from 'lucide-react'

function PipelineStatus({ brand, onRun }: { brand: any; onRun: () => void }) {
  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    never_run: { label: 'Not yet analysed', color: 'text-gray-400', icon: Clock },
    running: { label: 'Analysis running...', color: 'text-blue-400', icon: Loader2 },
    completed: { label: 'Analysis complete', color: 'text-green-400', icon: CheckCircle },
    error: { label: 'Analysis failed', color: 'text-red-400', icon: AlertTriangle },
  }
  const s = statusMap[brand.analysis_status] || statusMap.never_run
  const Icon = s.icon

  return (
    <div className="card flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon size={16} className={`${s.color} ${brand.analysis_status === 'running' ? 'animate-spin' : ''}`} />
        <div>
          <p className="text-sm font-medium text-gray-200">{brand.name}</p>
          <p className={`text-xs ${s.color}`}>{s.label}
            {brand.last_analysed && brand.analysis_status === 'completed' && (
              <span className="text-gray-500 ml-1">· {new Date(brand.last_analysed).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
            )}
          </p>
        </div>
      </div>
      <button
        className="btn-primary flex items-center gap-2 py-1.5"
        onClick={onRun}
        disabled={brand.analysis_status === 'running'}
      >
        {brand.analysis_status === 'running'
          ? <><Loader2 size={13} className="animate-spin" /> Running...</>
          : <><Play size={13} /> Run Full Analysis</>
        }
      </button>
    </div>
  )
}

function InsightSection({ title, content, icon: Icon, color }: any) {
  const [expanded, setExpanded] = useState(false)
  if (!content) return null
  const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
  const preview = text.slice(0, 300)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className={color} />
          <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-400 flex items-center gap-1">
          {expanded ? 'Less' : 'More'} <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      </div>
      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
        {expanded ? text : preview + (text.length > 300 ? '...' : '')}
      </pre>
    </div>
  )
}

export default function Dashboard() {
  const { activeBrand, refreshBrands } = useBrand()
  const navigate = useNavigate()
  const [kpis, setKpis] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [analysis, setAnalysis] = useState<any>(null)

  useEffect(() => {
    getDashboardOverview().then(r => setKpis(r.data)).catch(() => {})
    getAlerts(false).then(r => setAlerts(r.data.alerts)).catch(() => {})
    getChartData().then(r => setChartData(r.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeBrand) {
      getBrandAnalysis(activeBrand.id)
        .then(r => setAnalysis(r.data.analysis))
        .catch(() => {})
    }
  }, [activeBrand])

  const handleRunPipeline = async () => {
    if (!activeBrand) return
    try {
      await triggerPipeline(activeBrand.id)
      refreshBrands()
    } catch (e) {}
  }

  const steps = analysis?.steps || {}

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Performance Overview</h1>
          <p className="text-sm text-gray-400 mt-0.5">All platforms · This week</p>
        </div>
        {!activeBrand && (
          <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/brand-setup')}>
            <Zap size={14} /> Add Brand & Run Analysis
          </button>
        )}
      </div>

      {/* Pipeline status */}
      {activeBrand && (
        <PipelineStatus brand={activeBrand} onRun={handleRunPipeline} />
      )}

      {!activeBrand && (
        <div className="card border-blue-800/40 bg-blue-950/20 text-center py-8">
          <Zap size={32} className="text-blue-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-200 mb-1">No brand set up yet</p>
          <p className="text-xs text-gray-400 mb-4">Add a brand to auto-run competitor research, technical audit, ad copy, and more.</p>
          <button className="btn-primary mx-auto" onClick={() => navigate('/brand-setup')}>
            Add Your First Brand
          </button>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Spend" value={kpis ? `£${kpis.total_spend.toLocaleString()}` : '—'} change={kpis?.spend_change_pct} subLabel="Google + Meta combined" highlight />
        <KPICard label="Blended ROAS" value={kpis ? `${kpis.total_roas}x` : '—'} change={kpis?.roas_change_pct} subLabel="Revenue per £1 spent" />
        <KPICard label="Total Conversions" value={kpis?.total_conversions ?? '—'} change={kpis?.conv_change_pct} subLabel="Purchases + Leads" />
        <KPICard label="Blended CTR" value={kpis ? `${kpis.blended_ctr}%` : '—'} subLabel="Across all campaigns" />
      </div>

      {/* Platform split */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h3 className="text-sm font-semibold text-gray-200">Google Ads</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><p className="text-xs text-gray-500">Spend</p><p className="text-lg font-bold text-white">£{kpis?.google_spend?.toLocaleString() ?? '—'}</p></div>
            <div><p className="text-xs text-gray-500">ROAS</p><p className="text-lg font-bold text-white">{kpis?.google_roas ?? '—'}x</p></div>
            <div><p className="text-xs text-gray-500">Conv.</p><p className="text-lg font-bold text-white">{kpis?.google_conversions ?? '—'}</p></div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <h3 className="text-sm font-semibold text-gray-200">Meta Ads</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><p className="text-xs text-gray-500">Spend</p><p className="text-lg font-bold text-white">£{kpis?.meta_spend?.toLocaleString() ?? '—'}</p></div>
            <div><p className="text-xs text-gray-500">ROAS</p><p className="text-lg font-bold text-white">{kpis?.meta_roas ?? '—'}x</p></div>
            <div><p className="text-xs text-gray-500">Results</p><p className="text-lg font-bold text-white">{kpis?.meta_conversions ?? '—'}</p></div>
          </div>
        </div>
      </div>

      {/* Chart + Agent panel */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 card">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">14-Day Spend Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="mSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="google_spend" name="Google £" stroke="#3b82f6" fill="url(#gSpend)" strokeWidth={2} />
              <Area type="monotone" dataKey="meta_spend" name="Meta £" stroke="#a855f7" fill="url(#mSpend)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <AgentStatusPanel />
      </div>

      {/* Auto-generated brand insights */}
      {analysis && analysis.pipeline_complete && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Auto-Generated Insights</h2>
            <button className="text-xs text-blue-400 flex items-center gap-1" onClick={() => navigate('/approval-queue')}>
              Review Approval Queue <ChevronRight size={12} />
            </button>
          </div>
          <InsightSection title="Executive Summary" content={steps.executive_summary} icon={Zap} color="text-blue-400" />
          <InsightSection title="Competitor Intelligence" content={steps.competitor_research} icon={Search} color="text-orange-400" />
          <InsightSection title="Technical Health Analysis" content={steps.technical_health?.ai_analysis} icon={Shield} color="text-red-400" />
          <InsightSection title="Keyword Strategy" content={steps.keywords} icon={FileText} color="text-green-400" />
          <InsightSection title="Google Ads Copy Variants" content={steps.google_copy} icon={Paintbrush} color="text-blue-400" />
          <InsightSection title="Meta Ads Copy Variants" content={steps.meta_copy} icon={Paintbrush} color="text-purple-400" />
          <InsightSection title="RSA Headlines & Descriptions" content={steps.headlines} icon={FileText} color="text-yellow-400" />
          <InsightSection title="Hook Formats" content={steps.hooks} icon={Zap} color="text-pink-400" />
        </div>
      )}
    </div>
  )
}
