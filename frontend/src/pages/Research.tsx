import { useState } from 'react'
import { runCompetitorScan, runMarketContext, runResearch } from '../services/api'
import { Search, Globe, Zap, Loader2 } from 'lucide-react'

function ResultCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-200 mb-3">{title}</h3>
      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{content}</pre>
    </div>
  )
}

export default function Research() {
  const [brand, setBrand] = useState('')
  const [industry, setIndustry] = useState('')
  const [competitors, setCompetitors] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<{ title: string; content: string }[]>([])

  const run = async (type: 'competitor' | 'market' | 'full') => {
    if (!brand.trim()) return
    setLoading(type)
    try {
      const compList = competitors.split(',').map(s => s.trim()).filter(Boolean)
      let res
      if (type === 'competitor') res = await runCompetitorScan(brand, compList, industry)
      else if (type === 'market') res = await runMarketContext(brand, industry)
      else res = await runResearch(brand, compList, industry)

      const result = res.data.result
      const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2)
      const titles = { competitor: 'Competitor Intelligence Scan', market: 'Market Context Report', full: 'Unified Context Packet' }
      setResults(prev => [{ title: titles[type], content }, ...prev.slice(0, 2)])
    } catch (e: any) {
      setResults(prev => [{ title: 'Error', content: e.message || 'Something went wrong' }, ...prev.slice(0, 2)])
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Research & Intelligence</h1>
        <p className="text-sm text-gray-400 mt-0.5">A3 Agent — Competitor scan · Market context · Unified context packet</p>
      </div>

      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-200">Run Research Scan</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Your Brand *</label>
            <input
              className="input-field"
              placeholder="e.g. Nike Running"
              value={brand}
              onChange={e => setBrand(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Industry</label>
            <input
              className="input-field"
              placeholder="e.g. Athletic Footwear"
              value={industry}
              onChange={e => setIndustry(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Competitors (comma-separated)</label>
            <input
              className="input-field"
              placeholder="e.g. Adidas, Asics, New Balance"
              value={competitors}
              onChange={e => setCompetitors(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => run('competitor')}
            disabled={!!loading || !brand.trim()}
          >
            {loading === 'competitor' ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Competitor Scan
          </button>
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => run('market')}
            disabled={!!loading || !brand.trim()}
          >
            {loading === 'market' ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            Market Context
          </button>
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => run('full')}
            disabled={!!loading || !brand.trim()}
          >
            {loading === 'full' ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Full Context Packet
          </button>
        </div>
      </div>

      {loading && (
        <div className="card flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-blue-400" />
          <p className="text-sm text-gray-400">A3 Research agent is analysing... (this may take 15–30s)</p>
        </div>
      )}

      {results.map((r, i) => <ResultCard key={i} title={r.title} content={r.content} />)}
    </div>
  )
}
