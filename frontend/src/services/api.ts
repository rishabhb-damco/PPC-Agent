import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

// Dashboard
export const getDashboardOverview = () => api.get('/dashboard/overview')
export const getAlerts = (resolved = false) => api.get(`/dashboard/alerts?resolved=${resolved}`)
export const getChartData = () => api.get('/dashboard/chart-data')
export const getAgentRoster = () => api.get('/dashboard/agent-roster')

// Campaigns
export const getGoogleCampaigns = (status?: string) =>
  api.get(`/campaigns/google${status ? `?status=${status}` : ''}`)
export const getMetaCampaigns = (status?: string) =>
  api.get(`/campaigns/meta${status ? `?status=${status}` : ''}`)
export const getGoogleKeywords = (minQS?: number) =>
  api.get(`/campaigns/google/keywords${minQS ? `?min_qs=${minQS}` : ''}`)

// Agents
export const getAgentsStatus = () => api.get('/agents/status')
export const runOrchestrator = (input: string) => api.post('/agents/a0/route', { input })
export const runMetaMonitor = (input: string) => api.post('/agents/a1/monitor', { input })
export const generateKeywords = (input: string) => api.post('/agents/a2/keywords', { input })
export const generateHeadlines = (input: string, context?: object) =>
  api.post('/agents/a2/headlines', { input, context })
export const runResearch = (brand: string, competitors: string[], industry: string) =>
  api.post('/agents/a3/research', { brand, competitors, industry })
export const runCompetitorScan = (brand: string, competitors: string[], industry: string) =>
  api.post('/agents/a3/competitor', { brand, competitors, industry })
export const runMarketContext = (brand: string, industry: string) =>
  api.post('/agents/a3/market', { brand, competitors: [], industry })
export const getTechnicalHealth = () => api.get('/agents/a4/health')
export const generateCopy = (product: string, targetAudience: string, platform: string, tone?: string, numVariants?: number) =>
  api.post('/agents/a5/copy', { product, target_audience: targetAudience, platform, tone, num_variants: numVariants })
export const generateHooks = (product: string, targetAudience: string, platform: string) =>
  api.post('/agents/a5/hooks', { product, target_audience: targetAudience, platform })
export const getStaticBrief = (input: string, context?: object) =>
  api.post('/agents/a6/static-brief', { input, context })
export const getVideoScript = (input: string, context?: object) =>
  api.post('/agents/a6/video-script', { input, context })
export const getWeeklyReport = () => api.get('/agents/a7/weekly-report')
export const getScorecard = () => api.get('/agents/a7/scorecard')

// Reports
export const getReportsWeekly = () => api.get('/reports/weekly')
export const getKpiScorecard = () => api.get('/reports/kpi-scorecard')
export const getAnomalies = () => api.get('/reports/anomalies')

// Brands
export const getBrands = () => api.get('/brands/')
export const createBrand = (data: object) => api.post('/brands/', data)
export const getBrandDetail = (id: string) => api.get(`/brands/${id}`)
export const getBrandAnalysis = (id: string) => api.get(`/brands/${id}/analysis`)
export const triggerPipeline = (id: string) => api.post(`/brands/${id}/run-pipeline`)

// Approvals
export const getApprovals = (brandId?: string, status?: string) =>
  api.get('/approvals/', { params: { brand_id: brandId, status } })
export const actionApproval = (id: string, action: string) =>
  api.post(`/approvals/${id}/action`, { action })
export const bulkActionApprovals = (item_ids: string[], action: string) =>
  api.post('/approvals/bulk-action', { item_ids, action })
export const getApprovalStats = (brandId?: string) =>
  api.get('/approvals/stats', { params: { brand_id: brandId } })
