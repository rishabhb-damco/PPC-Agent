import { useEffect, useState } from 'react'
import { getMetaCampaigns } from '../services/api'
import KPICard from '../components/KPICard'

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'ACTIVE' ? 'badge-green' : 'badge-yellow'
  return <span className={cls}>{status}</span>
}

export default function MetaAds() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    getMetaCampaigns().then(r => { setCampaigns(r.data.campaigns); setSummary(r.data.summary) }).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Meta Ads</h1>
          <p className="text-xs text-gray-500 mt-0.5">Facebook · Instagram · Audience Network</p>
        </div>
        <span className="badge-blue">Future: Live API integration</span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Total Spend" value={`£${summary?.total_spend?.toLocaleString() ?? '—'}`} />
        <KPICard label="Purchases + Leads" value={summary?.total_results ?? '—'} />
        <KPICard label="Avg. ROAS" value={summary ? `${summary.avg_roas}x` : '—'} />
        <KPICard label="Active Campaigns" value={campaigns.filter(c => c.status === 'ACTIVE').length} />
      </div>

      <div className="card overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Campaigns</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left pb-3 pr-4">Campaign</th>
                <th className="text-left pb-3 pr-4">Status</th>
                <th className="text-right pb-3 pr-4">Spend</th>
                <th className="text-right pb-3 pr-4">Reach</th>
                <th className="text-right pb-3 pr-4">Freq.</th>
                <th className="text-right pb-3 pr-4">CTR</th>
                <th className="text-right pb-3 pr-4">CPM</th>
                <th className="text-right pb-3 pr-4">Results</th>
                <th className="text-right pb-3 pr-4">Cost/Result</th>
                <th className="text-right pb-3">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 pr-4 font-medium text-gray-200 max-w-[160px] truncate">{c.name}</td>
                  <td className="py-3 pr-4"><StatusBadge status={c.status} /></td>
                  <td className="py-3 pr-4 text-right text-gray-300">£{c.spend.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-right text-gray-400">{(c.reach / 1000).toFixed(0)}K</td>
                  <td className={`py-3 pr-4 text-right text-sm font-medium ${c.frequency >= 4 ? 'text-red-400' : c.frequency >= 2.5 ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {c.frequency}
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-300">{c.ctr}%</td>
                  <td className="py-3 pr-4 text-right text-gray-300">£{c.cpm}</td>
                  <td className="py-3 pr-4 text-right text-gray-300">{c.results.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-right text-gray-300">£{c.cost_per_result}</td>
                  <td className="py-3 text-right">
                    {c.roas ? (
                      <span className={c.roas >= 6 ? 'text-green-400' : c.roas >= 4 ? 'text-yellow-400' : 'text-red-400'}>
                        {c.roas}x
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequency Warning */}
      <div className="card border-yellow-800/40 bg-yellow-950/10">
        <h3 className="text-sm font-semibold text-yellow-400 mb-2">Frequency Management</h3>
        <p className="text-xs text-gray-400">
          <strong className="text-gray-300">Retargeting — Conversions</strong> has a frequency of{' '}
          <strong className="text-red-400">4.40</strong> — ad fatigue risk. Consider refreshing creatives
          or expanding the audience. Ideal retargeting frequency: 2–3x per week.
        </p>
      </div>
    </div>
  )
}
