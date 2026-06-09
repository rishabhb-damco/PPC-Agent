interface TargetBadgeProps {
  actual: number
  target: number | null | undefined
  higherIsBetter?: boolean  // true for ROAS/conv_rate; false (default) for CPL/CPC
  prefix?: string
  suffix?: string
  decimals?: number
}

export function TargetBadge({ actual, target, higherIsBetter = false, prefix = '', suffix = '', decimals = 2 }: TargetBadgeProps) {
  if (!target) return null

  const pctOff = ((actual - target) / target) * 100
  // For "lower is better" metrics (CPL): positive pctOff = bad (over target)
  // For "higher is better" metrics (ROAS): negative pctOff = bad (under target)
  const badness = higherIsBetter ? -pctOff : pctOff
  const abs = Math.abs(pctOff)

  let color: string
  let bg: string
  let label: string

  if (badness <= 15) {
    color = 'var(--success)'
    bg    = 'var(--success-dim)'
    label = badness <= 5 ? 'On target' : badness > 0 ? `↑${abs.toFixed(0)}% over` : `↓${abs.toFixed(0)}% under`
  } else if (badness <= 30) {
    color = 'var(--warning)'
    bg    = 'var(--warning-dim)'
    label = higherIsBetter ? `↓${abs.toFixed(0)}% under` : `↑${abs.toFixed(0)}% over`
  } else {
    color = '#F87171'
    bg    = 'var(--error-dim)'
    label = higherIsBetter ? `↓${abs.toFixed(0)}% under` : `↑${abs.toFixed(0)}% over`
  }

  if (badness <= 5 && abs <= 5) label = '✓ On target'

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
      style={{ color, backgroundColor: bg, border: `1px solid ${color}30` }}
      title={`Target: ${prefix}${target.toLocaleString(undefined, { maximumFractionDigits: decimals })}${suffix}`}
    >
      {label}
    </span>
  )
}

export function TargetLine({ actual, target, higherIsBetter = false, prefix = '', suffix = '', decimals = 2 }: TargetBadgeProps) {
  if (!target) return null
  const pctOff = ((actual - target) / target) * 100
  const badness = higherIsBetter ? -pctOff : pctOff
  let color = badness <= 15 ? 'var(--success)' : badness <= 30 ? 'var(--warning)' : '#F87171'

  return (
    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-hint)' }}>
      target{' '}
      <span style={{ color }}>
        {prefix}{target.toLocaleString(undefined, { maximumFractionDigits: decimals })}{suffix}
      </span>
    </p>
  )
}
