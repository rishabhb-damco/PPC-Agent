import { AlertTriangle, XCircle, Info, CheckCircle, X } from 'lucide-react'
import { useState } from 'react'

interface Alert {
  id: string
  severity: string
  title: string
  description: string
  platform: string
  campaign?: string | null
  timestamp: string
  resolved: boolean
}

const severityConfig: Record<string, { icon: typeof AlertTriangle; classes: string }> = {
  critical: { icon: XCircle, classes: 'bg-red-950/40 border-red-800 text-red-300' },
  error: { icon: AlertTriangle, classes: 'bg-orange-950/40 border-orange-800 text-orange-300' },
  warning: { icon: AlertTriangle, classes: 'bg-yellow-950/40 border-yellow-800 text-yellow-300' },
  info: { icon: Info, classes: 'bg-blue-950/40 border-blue-800 text-blue-300' },
}

export default function AlertBanner({ alerts }: { alerts: Alert[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const visible = alerts.filter(a => !dismissed.has(a.id))

  if (!visible.length) return null

  return (
    <div className="space-y-2">
      {visible.map(alert => {
        const cfg = severityConfig[alert.severity] || severityConfig.info
        const Icon = cfg.icon
        return (
          <div key={alert.id} className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${cfg.classes}`}>
            <Icon size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{alert.title}</p>
              <p className="text-xs opacity-70 mt-0.5">{alert.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] uppercase font-semibold opacity-60">{alert.platform}</span>
                {alert.campaign && (
                  <span className="text-[10px] opacity-50">· {alert.campaign}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
              className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
