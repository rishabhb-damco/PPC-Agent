import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface WoWChipProps {
  pct: number | null | undefined
  higherIsBetter?: boolean  // true for conversions/CTR/ROAS; false for CPL/CPC
  size?: 'sm' | 'xs'
}

export default function WoWChip({ pct, higherIsBetter = true, size = 'xs' }: WoWChipProps) {
  if (pct == null) return null

  const positive = higherIsBetter ? pct > 0 : pct < 0   // true = good
  const neutral  = Math.abs(pct) < 1

  const color = neutral ? 'var(--text-muted)' : positive ? 'var(--success)' : '#F87171'
  const bg    = neutral ? 'rgba(113,113,122,0.10)'
    : positive ? 'var(--success-dim)' : 'var(--error-dim)'
  const border = neutral ? 'var(--border-default)'
    : positive ? 'var(--success-border)' : 'var(--error-border)'

  const Icon  = neutral ? Minus : positive ? TrendingUp : TrendingDown
  const label = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}% WoW`
  const fs    = size === 'sm' ? 12 : 10

  return (
    <span
      className="inline-flex items-center gap-1 font-semibold rounded-md"
      style={{
        color, backgroundColor: bg,
        border: `1px solid ${border}`,
        fontSize: fs,
        padding: size === 'sm' ? '2px 7px' : '2px 5px',
      }}
      title="vs previous 7 days"
    >
      <Icon size={size === 'sm' ? 11 : 9} />
      {label}
    </span>
  )
}
