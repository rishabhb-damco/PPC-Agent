import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  label: string
  value: string | number
  change?: number
  subLabel?: string
  prefix?: string
  suffix?: string
  highlight?: boolean
}

export default function KPICard({
  label, value, change, subLabel, prefix = '', suffix = '', highlight = false,
}: KPICardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0

  return (
    <div
      className="card"
      style={highlight ? {
        borderColor: 'rgba(99,102,241,0.28)',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, #1C1C1F 55%)',
      } : undefined}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-3"
        style={{ color: 'var(--text-hint)' }}
      >
        {label}
      </p>

      <p
        className="text-[28px] font-bold leading-none tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>

      {change !== undefined && (
        <div
          className="inline-flex items-center gap-1 mt-3 px-2 py-0.5 rounded-md text-[11px] font-semibold"
          style={{
            backgroundColor: isPositive
              ? 'var(--success-dim)'
              : isNegative
              ? 'var(--error-dim)'
              : 'rgba(113,113,122,0.10)',
            color: isPositive ? 'var(--success)' : isNegative ? '#F87171' : 'var(--text-muted)',
          }}
        >
          {isPositive && <TrendingUp size={11} />}
          {isNegative && <TrendingDown size={11} />}
          {change > 0 ? '+' : ''}{change}% vs last week
        </div>
      )}

      {subLabel && (
        <p className="text-[11px] mt-2" style={{ color: 'var(--text-hint)' }}>
          {subLabel}
        </p>
      )}
    </div>
  )
}
