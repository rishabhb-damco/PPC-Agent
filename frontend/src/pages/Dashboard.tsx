import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import KPICard from '../components/KPICard'
import AlertBanner from '../components/AlertBanner'
import AgentStatusPanel from '../components/AgentStatusPanel'
import { getDashboardOverview, getAlerts, getChartData } from '../services/api'

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    getDashboardOverview().then(r => setKpis(r.data)).catch(() => {})
    getAlerts(false).then(r => setAlerts(r.data.alerts)).catch(() => {})
    getChartData().then(r => setChartData(r.data.data)).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Performance Overview</h1>
        <p className="text-sm text-gray-400 mt-0.5">All platforms · This week</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Spend"
          value={kpis ? `£${kpis.total_spend.toLocaleString()}` : '—'}
          change={kpis?.spend_change_pct}
          subLabel="Google + Meta combined"
          highlight
        />
        <KPICard
          label="Blended ROAS"
          value={kpis ? `${kpis.total_roas}x` : '—'}
          change={kpis?.roas_change_pct}
          subLabel="Revenue per £1 spent"
        />
        <KPICard
          label="Total Conversions"
          value={kpis?.total_conversions ?? '—'}
          change={kpis?.conv_change_pct}
          subLabel="Purchases + Leads"
        />
        <KPICard
          label="Blended CTR"
          value={kpis ? `${kpis.blended_ctr}%` : '—'}
          subLabel="Across all campaigns"
        />
      </div>

      {/* Platform split */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h3 className="text-sm font-semibold text-gray-200">Google Ads</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-gray-500">Spend</p>
              <p className="text-lg font-bold text-white">£{kpis?.google_spend?.toLocaleString() ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">ROAS</p>
              <p className="text-lg font-bold text-white">{kpis?.google_roas ?? '—'}x</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Conv.</p>
              <p className="text-lg font-bold text-white">{kpis?.google_conversions ?? '—'}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <h3 className="text-sm font-semibold text-gray-200">Meta Ads</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-gray-500">Spend</p>
              <p className="text-lg font-bold text-white">£{kpis?.meta_spend?.toLocaleString() ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">ROAS</p>
              <p className="text-lg font-bold text-white">{kpis?.meta_roas ?? '—'}x</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Results</p>
              <p className="text-lg font-bold text-white">{kpis?.meta_conversions ?? '—'}</p>
            </div>
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
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="google_spend" name="Google £" stroke="#3b82f6" fill="url(#gSpend)" strokeWidth={2} />
              <Area type="monotone" dataKey="meta_spend" name="Meta £" stroke="#a855f7" fill="url(#mSpend)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <AgentStatusPanel />
      </div>
    </div>
  )
}
