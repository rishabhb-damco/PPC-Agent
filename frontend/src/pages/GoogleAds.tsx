import { useEffect, useState } from 'react'
import { getGoogleCampaigns, getGoogleKeywords, getGoogleWow, getLeadQuality } from '../services/api'
import { useBrand } from '../context/BrandContext'
import KPICard from '../components/KPICard'
import { TargetBadge, TargetLine } from '../components/TargetBadge'
import WoWChip from '../components/WoWChip'

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'ENABLED' ? 'badge-green' : status === 'PAUSED' ? 'badge-yellow' : 'badge-red'
  return <span className={cls}>{status}</span>
}

function QSBadge({ qs }: { qs: number | null }) {
  if (qs === null) return <span style={{ color: 'var(--text-hint)', fontSize: 12 }}>—</span>
  const color = qs >= 7 ? 'var(--success)' : qs >= 5 ? 'var(--warning)' : '#F87171'
  return <span className="text-xs font-bold" style={{ color }}>{qs}/10</span>
}

function CplCell({ spend, conversions, targetCpl }: { spend: number; conversions: number; targetCpl?: number | null }) {
  if (!conversions) return <span style={{ color: 'var(--text-hint)' }}>—</span>
  const cpl = spend / conversions
  return (
    <div className="text-right">
      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>${cpl.toFixed(2)}</span>
      {targetCpl && <TargetBadge actual={cpl} target={targetCpl} prefix="$" decimals={0} />}
    </div>
  )
}

export default function GoogleAds() {
  const { activeBrand } = useBrand()
  const [campaigns, setCampaigns]   = useState<any[]>([])
  const [summary, setSummary]       = useState<any>(null)
  const [keywords, setKeywords]     = useState<any[]>([])
  const [dataSource, setDataSource] = useState<string>('mock')
  const [wow, setWow]               = useState<any>(null)
  const [leadQuality, setLeadQuality] = useState<any>(null)

  const isWellspring = activeBrand?.name?.toLowerCase().includes('wellspring')

  useEffect(() => {
    getGoogleCampaigns()
      .then(r => { setCampaigns(r.data.campaigns); setSummary(r.data.summary); setDataSource(r.data.data_source) })
      .catch(() => {})
    getGoogleKeywords().then(r => setKeywords(r.data.keywords)).catch(() => {})
    getGoogleWow().then(r => setWow(r.data)).catch(() => {})
    if (isWellspring) getLeadQuality().then(r => setLeadQuality(r.data)).catch(() => {})
  }, [activeBrand?.id])

  const targetCpl  = activeBrand?.target_cpl
  const targetRoas = activeBrand?.target_roas
  const currency   = activeBrand?.currency || 'USD'
  const sym        = currency === 'INR' ? '₹' : '$'

  // Compute avg CPL from summary
  const avgCpl = summary?.total_spend && summary?.total_conversions
    ? summary.total_spend / summary.total_conversions
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Google Ads</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-hint)' }}>
            {activeBrand?.name ?? 'All clients'} · Last 30 days
          </p>
        </div>
        <span
          className="text-[10px] font-medium px-2 py-1 rounded-md"
          style={{
            backgroundColor: dataSource === 'live' ? 'var(--success-dim)' : 'rgba(113,113,122,0.10)',
            color: dataSource === 'live' ? 'var(--success)' : 'var(--text-hint)',
            border: `1px solid ${dataSource === 'live' ? 'var(--success-border)' : 'var(--border-default)'}`,
          }}
        >
          {dataSource === 'live' ? 'Live data' : 'Mock data'}
        </span>
      </div>

      {/* KPI Cards with targets */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--text-hint)' }}>Total Spend</p>
          <p className="text-[26px] font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
            {sym}{summary?.total_spend?.toLocaleString() ?? '—'}
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <WoWChip pct={wow?.changes?.spend_pct} higherIsBetter={false} />
            {activeBrand?.target_monthly_spend && summary?.total_spend && (
              <TargetLine actual={summary.total_spend} target={activeBrand.target_monthly_spend} prefix={sym} decimals={0} />
            )}
          </div>
        </div>

        <div className="card">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--text-hint)' }}>Avg. CPL</p>
          <p className="text-[26px] font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
            {avgCpl ? `${sym}${avgCpl.toFixed(2)}` : '—'}
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <WoWChip pct={wow?.changes?.cpl_pct} higherIsBetter={false} />
            {avgCpl && targetCpl && <TargetBadge actual={avgCpl} target={targetCpl} prefix={sym} decimals={0} />}
          </div>
          {avgCpl && targetCpl && <TargetLine actual={avgCpl} target={targetCpl} prefix={sym} decimals={0} />}
        </div>

        <div className="card">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--text-hint)' }}>Avg. ROAS</p>
          <p className="text-[26px] font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
            {summary?.avg_roas ? `${summary.avg_roas}x` : '—'}
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {summary?.avg_roas && targetRoas && <TargetBadge actual={summary.avg_roas} target={targetRoas} suffix="x" higherIsBetter decimals={1} />}
          </div>
          {summary?.avg_roas && targetRoas && <TargetLine actual={summary.avg_roas} target={targetRoas} suffix="x" higherIsBetter decimals={1} />}
        </div>

        <div className="card">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--text-hint)' }}>Conversions</p>
          <p className="text-[26px] font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
            {summary?.total_conversions ?? '—'}
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <WoWChip pct={wow?.changes?.conversions_pct} higherIsBetter />
            {summary?.total_conversions && activeBrand?.target_monthly_leads && (
              <TargetLine actual={summary.total_conversions} target={activeBrand.target_monthly_leads} higherIsBetter decimals={0} />
            )}
          </div>
        </div>
      </div>

      {/* Campaigns table */}
      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-hint)' }}>Campaigns</h3>
          <span className="text-xs" style={{ color: 'var(--text-hint)' }}>{campaigns.filter(c => c.status === 'ENABLED').length} active</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider border-b border-gray-800" style={{ color: 'var(--text-hint)' }}>
                <th className="text-left px-4 py-2.5">Campaign</th>
                <th className="text-left px-3 py-2.5">Status</th>
                <th className="text-right px-3 py-2.5">Spend</th>
                <th className="text-right px-3 py-2.5">Conv.</th>
                <th className="text-right px-3 py-2.5">CPL {targetCpl ? `(target ${sym}${targetCpl})` : ''}</th>
                <th className="text-right px-3 py-2.5">ROAS</th>
                <th className="text-right px-4 py-2.5">QS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text-primary)', fontSize: 13 }}>{c.name}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-2.5 text-right text-sm" style={{ color: 'var(--text-secondary)' }}>{sym}{c.spend.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right text-sm" style={{ color: 'var(--text-secondary)' }}>{c.conversions}</td>
                  <td className="px-3 py-2.5">
                    <CplCell spend={c.spend} conversions={c.conversions} targetCpl={targetCpl} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {c.roas != null ? (
                      <div>
                        <span className="text-sm" style={{
                          color: targetRoas
                            ? (c.roas >= targetRoas ? 'var(--success)' : c.roas >= targetRoas * 0.85 ? 'var(--warning)' : '#F87171')
                            : (c.roas >= 5 ? 'var(--success)' : c.roas >= 3 ? 'var(--warning)' : '#F87171')
                        }}>{c.roas}x</span>
                        {targetRoas && <TargetBadge actual={c.roas} target={targetRoas} suffix="x" higherIsBetter decimals={1} />}
                      </div>
                    ) : <span style={{ color: 'var(--text-hint)' }}>—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right"><QSBadge qs={c.quality_score_avg} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Keywords table */}
      <div className="card overflow-hidden p-0">
        <div className="px-4 py-2.5 border-b border-gray-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-hint)' }}>Keywords Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider border-b border-gray-800" style={{ color: 'var(--text-hint)' }}>
                <th className="text-left px-4 py-2.5">Keyword</th>
                <th className="text-left px-3 py-2.5">Match</th>
                <th className="text-right px-3 py-2.5">QS</th>
                <th className="text-right px-3 py-2.5">Clicks</th>
                <th className="text-right px-3 py-2.5">CTR</th>
                <th className="text-right px-3 py-2.5">CPC</th>
                <th className="text-right px-4 py-2.5">Conv.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {keywords.map((k, i) => (
                <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{k.keyword}</td>
                  <td className="px-3 py-2.5"><span className="badge-blue">{k.match_type}</span></td>
                  <td className="px-3 py-2.5 text-right"><QSBadge qs={k.quality_score} /></td>
                  <td className="px-3 py-2.5 text-right text-sm" style={{ color: 'var(--text-secondary)' }}>{k.clicks.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right text-sm" style={{ color: 'var(--text-secondary)' }}>{k.ctr}%</td>
                  <td className="px-3 py-2.5 text-right text-sm" style={{ color: 'var(--text-secondary)' }}>${k.avg_cpc}</td>
                  <td className="px-4 py-2.5 text-right text-sm" style={{ color: 'var(--text-secondary)' }}>{k.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Quality Bridge — Wellspring only (F11) */}
      {isWellspring && leadQuality && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-hint)' }}>Lead Quality by Source</h3>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-hint)' }}>
                Overall scheduling rate: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{leadQuality.overall_scheduling_rate}%</span>
                {' '}· {leadQuality.total_leads} total leads · {leadQuality.total_scheduled} scheduled
              </p>
            </div>
            <span
              className="text-[10px] px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: leadQuality.data_source === 'live' ? 'var(--success-dim)' : 'rgba(113,113,122,0.10)',
                color: leadQuality.data_source === 'live' ? 'var(--success)' : 'var(--text-hint)',
                border: `1px solid ${leadQuality.data_source === 'live' ? 'var(--success-border)' : 'var(--border-default)'}`,
              }}
            >
              {leadQuality.data_source === 'live' ? 'Live' : 'Mock data'}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider border-b border-gray-800" style={{ color: 'var(--text-hint)' }}>
                <th className="text-left px-4 py-2">Source</th>
                <th className="text-right px-3 py-2">Leads</th>
                <th className="text-right px-3 py-2">Scheduled</th>
                <th className="text-right px-3 py-2">Scheduling Rate</th>
                <th className="text-right px-4 py-2">vs Average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {(leadQuality.sources || []).map((s: any) => (
                <tr key={s.source} className="hover:bg-gray-800/20">
                  <td className="px-4 py-2.5 font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{s.source}</td>
                  <td className="px-3 py-2.5 text-right text-sm" style={{ color: 'var(--text-secondary)' }}>{s.leads}</td>
                  <td className="px-3 py-2.5 text-right text-sm" style={{ color: 'var(--text-secondary)' }}>{s.scheduled}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-sm font-semibold" style={{
                      color: s.quality === 'high' ? 'var(--success)' : s.quality === 'low' ? '#F87171' : 'var(--text-primary)'
                    }}>
                      {s.scheduling_rate}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {s.vs_average !== 0 && (
                      <span className="text-xs font-semibold" style={{
                        color: s.vs_average > 0 ? 'var(--success)' : '#F87171'
                      }}>
                        {s.vs_average > 0 ? '+' : ''}{s.vs_average}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
