import { useState } from 'react'
import { generateCopy, generateHooks, generateHeadlines } from '../services/api'
import { Paintbrush, Zap, Type, Loader2, AlertTriangle } from 'lucide-react'

export default function CopyCreative() {
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [platform, setPlatform] = useState('google')
  const [tone, setTone] = useState('professional')
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<{ type: string; content: string }[]>([])

  const run = async (type: 'copy' | 'hooks' | 'headlines') => {
    if (!product.trim()) return
    setLoading(type)
    try {
      let res
      if (type === 'copy') res = await generateCopy(product, audience, platform, tone, 3)
      else if (type === 'hooks') res = await generateHooks(product, audience, platform)
      else res = await generateHeadlines(product, { product, platform })

      const content = typeof res.data.result === 'string' ? res.data.result : JSON.stringify(res.data.result, null, 2)
      const titles = { copy: 'Ad Copy Variants (A5)', hooks: 'Hook Formats (A5)', headlines: 'RSA Headlines (A2)' }
      setResults(prev => [{ type: titles[type], content }, ...prev.slice(0, 3)])
    } catch (e: any) {
      setResults(prev => [{ type: 'Error', content: e.message }, ...prev])
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Copy & Creative</h1>
        <p className="text-sm text-gray-400 mt-0.5">A5 Copy & Concept · A2 Google Headlines</p>
      </div>

      {/* Human gate notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg border bg-yellow-950/20 border-yellow-800/40">
        <AlertTriangle size={16} className="text-yellow-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-yellow-300">Human Oversight Gate: Creative Use Approval</p>
          <p className="text-xs text-gray-400 mt-0.5">
            All generated copy requires human review and approval before going live. Never push AI copy to ads without review.
          </p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Product / Service *</label>
            <input className="input-field" placeholder="e.g. Nike Air Max 270" value={product} onChange={e => setProduct(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Target Audience</label>
            <input className="input-field" placeholder="e.g. Men 25-45 interested in fitness" value={audience} onChange={e => setAudience(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Platform</label>
            <select className="input-field" value={platform} onChange={e => setPlatform(e.target.value)}>
              <option value="google">Google Ads</option>
              <option value="meta">Meta Ads</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tone</label>
            <select className="input-field" value={tone} onChange={e => setTone(e.target.value)}>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="urgent">Urgent/Direct Response</option>
              <option value="playful">Playful</option>
              <option value="luxury">Luxury/Premium</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary flex items-center gap-2" onClick={() => run('copy')} disabled={!!loading || !product.trim()}>
            {loading === 'copy' ? <Loader2 size={14} className="animate-spin" /> : <Paintbrush size={14} />}
            Ad Copy Variants
          </button>
          <button className="btn-secondary flex items-center gap-2" onClick={() => run('hooks')} disabled={!!loading || !product.trim()}>
            {loading === 'hooks' ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Hook Formats
          </button>
          <button className="btn-secondary flex items-center gap-2" onClick={() => run('headlines')} disabled={!!loading || !product.trim()}>
            {loading === 'headlines' ? <Loader2 size={14} className="animate-spin" /> : <Type size={14} />}
            RSA Headlines
          </button>
        </div>
      </div>

      {loading && (
        <div className="card flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-blue-400" />
          <p className="text-sm text-gray-400">Agent generating copy... (15–30s)</p>
        </div>
      )}

      {results.map((r, i) => (
        <div key={i} className="card">
          <h3 className="text-sm font-semibold text-blue-400 mb-3">{r.type}</h3>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{r.content}</pre>
        </div>
      ))}
    </div>
  )
}
