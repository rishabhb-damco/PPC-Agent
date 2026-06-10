import { useState } from 'react'
import { updateBrandTargets } from '../services/api'
import { X, Target, Loader2 } from 'lucide-react'

interface Brand {
  id: string
  name: string
  currency?: string
  target_cpl?: number | null
  target_roas?: number | null
  target_monthly_leads?: number | null
  target_conv_rate?: number | null
  target_monthly_spend?: number | null
}

interface Props {
  brand: Brand
  onClose: () => void
  onSaved: () => void
}

export default function TargetsModal({ brand, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [form, setForm]     = useState({
    currency:             brand.currency             || 'USD',
    target_cpl:           brand.target_cpl           != null ? String(brand.target_cpl)           : '',
    target_roas:          brand.target_roas          != null ? String(brand.target_roas)          : '',
    target_monthly_leads: brand.target_monthly_leads != null ? String(brand.target_monthly_leads) : '',
    target_conv_rate:     brand.target_conv_rate     != null ? String(brand.target_conv_rate)     : '',
    target_monthly_spend: brand.target_monthly_spend != null ? String(brand.target_monthly_spend) : '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      // Only send fields the user has filled in (exclude_unset=True on backend)
      const payload: Record<string, any> = { currency: form.currency }
      if (form.target_cpl           !== '') payload.target_cpl           = parseFloat(form.target_cpl)
      if (form.target_roas          !== '') payload.target_roas          = parseFloat(form.target_roas)
      if (form.target_monthly_leads !== '') payload.target_monthly_leads = parseInt(form.target_monthly_leads)
      if (form.target_conv_rate     !== '') payload.target_conv_rate     = parseFloat(form.target_conv_rate)
      if (form.target_monthly_spend !== '') payload.target_monthly_spend = parseFloat(form.target_monthly_spend)

      await updateBrandTargets(brand.id, payload)
      onSaved()
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const sym = form.currency === 'INR' ? '₹' : form.currency === 'GBP' ? '£' : form.currency === 'EUR' ? '€' : '$'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-xl border shadow-2xl"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Target size={15} style={{ color: 'var(--brand)' }} />
            <div>
              <p className="text-sm font-semibold text-white">Set Targets</p>
              <p className="text-[11px]" style={{ color: 'var(--text-hint)' }}>{brand.name}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} className="hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3">
          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--error-dim)', color: '#F87171' }}>
              {error}
            </p>
          )}

          <div>
            <label className="text-[11px] font-medium mb-1 block" style={{ color: 'var(--text-hint)' }}>Currency</label>
            <select className="input-field" value={form.currency} onChange={set('currency')}>
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium mb-1 block" style={{ color: 'var(--text-hint)' }}>
                Target CPL ({sym})
              </label>
              <input className="input-field" type="number" placeholder="e.g. 75"
                value={form.target_cpl} onChange={set('target_cpl')} />
            </div>
            <div>
              <label className="text-[11px] font-medium mb-1 block" style={{ color: 'var(--text-hint)' }}>Target ROAS</label>
              <input className="input-field" type="number" step="0.1" placeholder="e.g. 4.5"
                value={form.target_roas} onChange={set('target_roas')} />
            </div>
            <div>
              <label className="text-[11px] font-medium mb-1 block" style={{ color: 'var(--text-hint)' }}>
                Monthly Budget ({sym})
              </label>
              <input className="input-field" type="number" placeholder="e.g. 3500"
                value={form.target_monthly_spend} onChange={set('target_monthly_spend')} />
            </div>
            <div>
              <label className="text-[11px] font-medium mb-1 block" style={{ color: 'var(--text-hint)' }}>Leads / Month</label>
              <input className="input-field" type="number" placeholder="e.g. 40"
                value={form.target_monthly_leads} onChange={set('target_monthly_leads')} />
            </div>
          </div>

          <p className="text-[10px]" style={{ color: 'var(--text-hint)' }}>
            Leave a field blank to keep the existing value. Targets drive health scoring, pacing, and performance indicators.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={13} className="animate-spin" />}
            {saving ? 'Saving...' : 'Save Targets'}
          </button>
        </div>
      </div>
    </div>
  )
}
