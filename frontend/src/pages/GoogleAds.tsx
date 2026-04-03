import { useEffect, useState } from 'react'
import { getGoogleCampaigns, getGoogleKeywords } from '../services/api'
import KPICard from '../components/KPICard'
import { TrendingUp, TrendingDown } from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'ENABLED' ? 'badge-green' : status === 'PAUSED' ? 'badge-yellow' : 'badge-red'
  return <span className={cls}>{status}</span>
}

function QSBadge({ qs }: { qs: number | null }) {
  if (qs === null) return <span className="text-gray-500 text-xs">—</span>
  const cls = qs >= 7 ? 'text-green-400' : qs >= 5 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`text-xs font-bold ${cls}`}>{qs}/10</span>
}

export default function GoogleAds() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [keywords, setKeywords] = useState<any[]>([])

  useEffect(() => {
    getGoogleCampaigns().then(r => { setCampaigns(r.data.campaigns); setSummary(r.data.summary) }).catch(() => {})
    getGoogleKeywords().then(r => setKeywords(r.data.keywords)).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Google Ads</h1>

      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Total Spend" value={`£${summary?.total_spend?.toLocaleString() ?? '—'}`} />
        <KPICard label="Total Conversions" value={summary?.total_conversions ?? '—'} />
        <KPICard label="Avg. ROAS" value={summary ? `${summary.avg_roas}x` : '—'} />
        <KPICard label="Active Campaigns" value={campaigns.filter(c => c.status === 'ENABLED').length} />
      </div>

      {/* Campaigns table */}
      <div className="card overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Campaigns</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left pb-3 pr-4">Campaign</th>
                <th className="text-left pb-3 pr-4">Status</th>
                <th className="text-right pb-3 pr-4">Spend</th>
                <th className="text-right pb-3 pr-4">CTR</th>
                <th className="text-right pb-3 pr-4">CPC</th>
                <th className="text-right pb-3 pr-4">Conv.</th>
                <th className="text-right pb-3 pr-4">ROAS</th>
                <th className="text-right pb-3">QS Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 pr-4 font-medium text-gray-200">{c.name}</td>
                  <td className="py-3 pr-4"><StatusBadge status={c.status} /></td>
                  <td className="py-3 pr-4 text-right text-gray-300">£{c.spend.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-right text-gray-300">{c.ctr}%</td>
                  <td className="py-3 pr-4 text-right text-gray-300">£{c.avg_cpc}</td>
                  <td className="py-3 pr-4 text-right text-gray-300">{c.conversions}</td>
                  <td className="py-3 pr-4 text-right">
                    <span className={c.roas >= 5 ? 'text-green-400' : c.roas >= 3 ? 'text-yellow-400' : 'text-red-400'}>
                      {c.roas}x
                    </span>
                  </td>
                  <td className="py-3 text-right"><QSBadge qs={c.quality_score_avg} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Keywords table */}
      <div className="card overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Keywords Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left pb-3 pr-4">Keyword</th>
                <th className="text-left pb-3 pr-4">Match</th>
                <th className="text-right pb-3 pr-4">QS</th>
                <th className="text-right pb-3 pr-4">Impr.</th>
                <th className="text-right pb-3 pr-4">Clicks</th>
                <th className="text-right pb-3 pr-4">CTR</th>
                <th className="text-right pb-3 pr-4">CPC</th>
                <th className="text-right pb-3">Conv.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {keywords.map((k, i) => (
                <tr key={i} className="hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 pr-4 font-medium text-gray-200">{k.keyword}</td>
                  <td className="py-3 pr-4"><span className="badge-blue">{k.match_type}</span></td>
                  <td className="py-3 pr-4 text-right"><QSBadge qs={k.quality_score} /></td>
                  <td className="py-3 pr-4 text-right text-gray-400">{k.impressions.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-right text-gray-300">{k.clicks.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-right text-gray-300">{k.ctr}%</td>
                  <td className="py-3 pr-4 text-right text-gray-300">£{k.avg_cpc}</td>
                  <td className="py-3 text-right text-gray-300">{k.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
