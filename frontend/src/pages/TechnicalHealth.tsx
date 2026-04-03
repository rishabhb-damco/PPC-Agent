import { useEffect, useState } from 'react'
import { getTechnicalHealth } from '../services/api'
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Loader2 } from 'lucide-react'

function HealthRow({ check }: { check: any }) {
  const cfg = {
    healthy: { icon: CheckCircle, cls: 'text-green-400', bg: 'bg-green-900/20 border-green-800/40' },
    warning: { icon: AlertTriangle, cls: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-800/40' },
    critical: { icon: XCircle, cls: 'text-red-400', bg: 'bg-red-900/20 border-red-800/40' },
  }
  const c = cfg[check.status as keyof typeof cfg] || cfg.healthy
  const Icon = c.icon

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${c.bg}`}>
      <Icon size={16} className={`${c.cls} mt-0.5 shrink-0`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-200">{check.service}</p>
        <p className="text-xs text-gray-400 mt-0.5">{check.details}</p>
      </div>
      <span className={`text-xs font-semibold uppercase ${c.cls}`}>{check.status}</span>
    </div>
  )
}

export default function TechnicalHealth() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchHealth = () => {
    setLoading(true)
    getTechnicalHealth()
      .then(r => setData(r.data.result))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchHealth() }, [])

  const statusCls = data?.overall_status === 'healthy'
    ? 'text-green-400' : data?.overall_status === 'warning'
    ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Technical Health</h1>
          <p className="text-sm text-gray-400 mt-0.5">A4 Agent — Pixel validation · Tag audit · Uptime monitoring</p>
        </div>
        <button className="btn-secondary flex items-center gap-2" onClick={fetchHealth} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {data && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className={`text-3xl font-bold ${statusCls} capitalize`}>{data.overall_status}</p>
              <p className="text-xs text-gray-500 mt-1">Overall Status</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-red-400">{data.critical_issues}</p>
              <p className="text-xs text-gray-500 mt-1">Critical Issues</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-yellow-400">{data.warnings}</p>
              <p className="text-xs text-gray-500 mt-1">Warnings</p>
            </div>
          </div>

          {/* Health checks */}
          <div className="card space-y-2">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">System Checks</h3>
            {data.health_checks?.map((c: any, i: number) => (
              <HealthRow key={i} check={c} />
            ))}
          </div>

          {/* AI Analysis */}
          {data.ai_analysis && (
            <div className="card">
              <h3 className="text-sm font-semibold text-blue-400 mb-3">A4 Agent Analysis & Recommendations</h3>
              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                {data.ai_analysis}
              </pre>
            </div>
          )}
        </>
      )}

      {loading && !data && (
        <div className="card flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-blue-400" />
          <p className="text-sm text-gray-400">Running health check...</p>
        </div>
      )}
    </div>
  )
}
