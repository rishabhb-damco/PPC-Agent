import { useState } from 'react'
import { runCompetitorScan, runMarketContext, runResearch } from '../services/api'
import { useBrand } from '../context/BrandContext'
import { Search, Globe, Zap, Loader2, Plus, X, TrendingUp } from 'lucide-react'

function ResultCard({ title, content }: { title: string; content: string }) {
  const [expanded, setExpanded] = useState(false)
  const preview = content.slice(0, 500)
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        {content.length > 500 && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-400">
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
        {expanded ? content : preview + (content.length > 500 ? '...' : '')}
      </pre>
    </div>
  )
}

export default function Research() {
  const { activeBrand } = useBrand()

  // Pre-fill from active brand
  const [brand, setBrand] = useState(activeBrand?.name || '')
  const [industry, setIndustry] = useState(activeBrand?.industry || '')
  const [competitors, setCompetitors] = useState<string[]>(activeBrand?.competitors || [])
  const [competitorInput, setCompetitorInput] = useState('')

  // Brand comparison inputs
  const [ourWebsite, setOurWebsite] = useState(activeBrand?.website || '')
  const [ourMonthlyBudget, setOurMonthlyBudget] = useState(activeBrand?.monthly_budget || '')
  const [ourAudience, setOurAudience] = useState(activeBrand?.target_audience || '')
  const [ourStrengths, setOurStrengths] = useState('')
  const [ourWeaknesses, setOurWeaknesses] = useState('')

  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<{ title: string; content: string }[]>([])

  const addCompetitor = () => {
    if (competitorInput.trim() && !competitors.includes(competitorInput.trim())) {
      setCompetitors(prev => [...prev, competitorInput.trim()])
      setCompetitorInput('')
    }
  }

  const run = async (type: 'competitor' | 'market' | 'full' | 'comparison') => {
    if (!brand.trim()) return
    setLoading(type)
    try {
      let res
      if (type === 'comparison') {
        // Send our brand details as context for a richer comparison
        const enrichedBrand = `${brand} (Website: ${ourWebsite || 'N/A'}, Budget: ${ourMonthlyBudget || 'N/A'}, Audience: ${ourAudience || 'N/A'}, Strengths: ${ourStrengths || 'N/A'}, Weaknesses: ${ourWeaknesses || 'N/A'})`
        res = await runCompetitorScan(enrichedBrand, competitors, industry)
      } else if (type === 'competitor') {
        res = await runCompetitorScan(brand, competitors, industry)
      } else if (type === 'market') {
        res = await runMarketContext(brand, industry)
      } else {
        res = await runResearch(brand, competitors, industry)
      }

      const result = res.data.result
      const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2)
      const titles = {
        competitor: 'Competitor Intelligence Scan',
        market: 'Market Context Report',
        full: 'Unified Context Packet',
        comparison: `Brand Comparison: ${brand} vs Competitors`,
      }
      setResults(prev => [{ title: titles[type], content }, ...prev.slice(0, 3)])
    } catch (e: any) {
      setResults(prev => [{ title: 'Error', content: e.message || 'Something went wrong' }, ...prev.slice(0, 3)])
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Research & Intelligence</h1>
        <p className="text-sm text-gray-400 mt-0.5">A3 Agent — Competitor scan · Market context · Brand comparison</p>
      </div>

      {/* Brand input */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-200">Research Target</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Your Brand *</label>
            <input className="input-field" placeholder="e.g. Wellspring Therapeutic" value={brand} onChange={e => setBrand(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Industry</label>
            <input className="input-field" placeholder="e.g. Healthcare" value={industry} onChange={e => setIndustry(e.target.value)} />
          </div>
        </div>

        {/* Competitors */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block">Competitors to Scan</label>
          <div className="flex gap-2 mb-2">
            <input
              className="input-field"
              placeholder="Type competitor name and press Enter"
              value={competitorInput}
              onChange={e => setCompetitorInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCompetitor()}
            />
            <button className="btn-secondary px-3 shrink-0" onClick={addCompetitor}><Plus size={14} /></button>
          </div>
          {competitors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {competitors.map(c => (
                <span key={c} className="flex items-center gap-1 text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">
                  {c}
                  <button onClick={() => setCompetitors(prev => prev.filter(x => x !== c))} className="text-gray-500 hover:text-red-400 ml-0.5">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 flex-wrap">
          <button className="btn-primary flex items-center gap-2" onClick={() => run('competitor')} disabled={!!loading || !brand.trim()}>
            {loading === 'competitor' ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Competitor Scan
          </button>
          <button className="btn-secondary flex items-center gap-2" onClick={() => run('market')} disabled={!!loading || !brand.trim()}>
            {loading === 'market' ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            Market Context
          </button>
          <button className="btn-secondary flex items-center gap-2" onClick={() => run('full')} disabled={!!loading || !brand.trim()}>
            {loading === 'full' ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Full Context Packet
          </button>
        </div>
      </div>

      {/* Brand Comparison Section */}
      <div className="card space-y-4 border-blue-800/30 bg-blue-950/10">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-200">Brand Comparison — Us vs Them</h3>
        </div>
        <p className="text-xs text-gray-400">Add your brand details for a head-to-head comparison with competitors. The AI will analyse positioning, gaps, and opportunities.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Our Website</label>
            <input className="input-field" placeholder="https://ourwebsite.com" value={ourWebsite} onChange={e => setOurWebsite(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Monthly Ad Budget</label>
            <input className="input-field" placeholder="e.g. £5,000/month" value={ourMonthlyBudget} onChange={e => setOurMonthlyBudget(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Our Target Audience</label>
            <input className="input-field" placeholder="e.g. Adults 30-55 with anxiety" value={ourAudience} onChange={e => setOurAudience(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Our Key Strengths</label>
            <input className="input-field" placeholder="e.g. Specialised therapists, quick booking" value={ourStrengths} onChange={e => setOurStrengths(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Our Known Weaknesses / Challenges</label>
            <input className="input-field" placeholder="e.g. Low brand awareness, high CPC, limited budget" value={ourWeaknesses} onChange={e => setOurWeaknesses(e.target.value)} />
          </div>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => run('comparison')}
          disabled={!!loading || !brand.trim() || competitors.length === 0}
        >
          {loading === 'comparison' ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
          Run Brand Comparison
        </button>
        {competitors.length === 0 && (
          <p className="text-xs text-gray-500">Add at least one competitor above to run comparison.</p>
        )}
      </div>

      {loading && (
        <div className="card flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-blue-400" />
          <p className="text-sm text-gray-400">A3 Research agent analysing... (15–30s)</p>
        </div>
      )}

      {results.map((r, i) => <ResultCard key={i} title={r.title} content={r.content} />)}
    </div>
  )
}
