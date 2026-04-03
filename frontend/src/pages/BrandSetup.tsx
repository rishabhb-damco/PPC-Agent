import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBrand } from '../services/api'
import { useBrand } from '../context/BrandContext'
import { Zap, Plus, X, Loader2 } from 'lucide-react'

export default function BrandSetup() {
  const navigate = useNavigate()
  const { refreshBrands, setActiveBrand } = useBrand()
  const [loading, setLoading] = useState(false)
  const [competitorInput, setCompetitorInput] = useState('')
  const [form, setForm] = useState({
    name: '', website: '', industry: '', target_audience: '',
    monthly_budget: '', goals: '', platforms: ['google', 'meta'],
    competitors: [] as string[],
  })

  const addCompetitor = () => {
    if (competitorInput.trim() && !form.competitors.includes(competitorInput.trim())) {
      setForm(f => ({ ...f, competitors: [...f.competitors, competitorInput.trim()] }))
      setCompetitorInput('')
    }
  }

  const removeCompetitor = (c: string) =>
    setForm(f => ({ ...f, competitors: f.competitors.filter(x => x !== c) }))

  const togglePlatform = (p: string) =>
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p],
    }))

  const handleSubmit = async () => {
    if (!form.name || !form.industry) return
    setLoading(true)
    try {
      const res = await createBrand(form)
      refreshBrands()
      setActiveBrand(res.data.brand)
      navigate('/dashboard')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Add New Brand</h1>
        <p className="text-sm text-gray-400 mt-1">
          Fill in the details below. Once saved, all 8 agents will automatically run a full analysis —
          competitor research, technical audit, ad copy, headlines, Meta strategy, and a complete report.
        </p>
      </div>

      {/* Auto-run notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-blue-950/30 border border-blue-800/40">
        <Zap size={16} className="text-blue-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-300">Full Auto-Analysis on Save</p>
          <p className="text-xs text-gray-400 mt-0.5">
            As soon as you save, the system runs: Competitor Scan → Technical Audit → Keyword Strategy →
            Ad Copy Variants → RSA Headlines → Meta Strategy → Design Brief → Full Report.
            All outputs go to the Approval Queue for your review.
          </p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Brand Name *</label>
            <input className="input-field" placeholder="e.g. Wellspring Therapeutic"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Website</label>
            <input className="input-field" placeholder="https://example.com"
              value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Industry *</label>
            <input className="input-field" placeholder="e.g. Healthcare, E-commerce, SaaS"
              value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Monthly Budget</label>
            <input className="input-field" placeholder="e.g. £5,000/month"
              value={form.monthly_budget} onChange={e => setForm(f => ({ ...f, monthly_budget: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Target Audience</label>
          <input className="input-field" placeholder="e.g. Adults 30-55 struggling with anxiety, looking for therapy"
            value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Campaign Goals</label>
          <input className="input-field" placeholder="e.g. Generate therapy consultation bookings, grow brand awareness"
            value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))} />
        </div>

        {/* Platforms */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block">Advertising Platforms</label>
          <div className="flex gap-2">
            {['google', 'meta'].map(p => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                  form.platforms.includes(p)
                    ? 'bg-blue-600/20 text-blue-400 border-blue-600/50'
                    : 'bg-gray-800 text-gray-500 border-gray-700'
                }`}
              >
                {p === 'google' ? 'Google Ads' : 'Meta Ads'}
              </button>
            ))}
          </div>
        </div>

        {/* Competitors */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block">Known Competitors</label>
          <div className="flex gap-2 mb-2">
            <input
              className="input-field"
              placeholder="Add competitor name and press Enter"
              value={competitorInput}
              onChange={e => setCompetitorInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCompetitor()}
            />
            <button className="btn-secondary px-3" onClick={addCompetitor}>
              <Plus size={14} />
            </button>
          </div>
          {form.competitors.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.competitors.map(c => (
                <span key={c} className="flex items-center gap-1 text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">
                  {c}
                  <button onClick={() => removeCompetitor(c)} className="text-gray-500 hover:text-red-400">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          className="btn-primary flex items-center gap-2 px-6"
          onClick={handleSubmit}
          disabled={loading || !form.name || !form.industry}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          {loading ? 'Saving & Running Analysis...' : 'Save & Run Full Analysis'}
        </button>
        <button className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </div>
  )
}
