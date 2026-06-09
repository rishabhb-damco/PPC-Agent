import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

// Attach token from localStorage to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ppc_agent_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear token and redirect to login (only if not already there)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const onLoginPage = window.location.hash.includes('/login')
      if (!onLoginPage) {
        localStorage.removeItem('ppc_agent_token')
        window.location.hash = '#/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────

export const loginUser = (email: string, password: string) => {
  // Backend uses OAuth2PasswordRequestForm (form-encoded, username field = email)
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  return axios.post(`${BASE_URL}/api/v1/auth/login`, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export const registerUser = (email: string, password: string, full_name: string) =>
  api.post('/auth/register', { email, password, full_name })

export const getMe = (token?: string) =>
  axios.get(`${BASE_URL}/api/v1/auth/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

// Dashboard
export const getDashboardOverview = () => api.get('/dashboard/overview')
export const getAlerts = (resolved = false) => api.get(`/dashboard/alerts?resolved=${resolved}`)
export const getChartData = () => api.get('/dashboard/chart-data')
export const getAgentRoster = () => api.get('/dashboard/agent-roster')

// Campaigns
export const getGoogleCampaigns = (status?: string) =>
  api.get(`/campaigns/google${status ? `?status=${status}` : ''}`)
export const getMetaCampaigns = (brandId?: string, status?: string) => {
  const params = new URLSearchParams()
  if (brandId) params.append('brand_id', brandId)
  if (status)  params.append('status', status)
  const qs = params.toString()
  return api.get(`/campaigns/meta${qs ? `?${qs}` : ''}`)
}

export const saveMetaSnapshot = (brandId: string, data: { campaigns: object[]; currency: string; source: string; pulled_at: string }) =>
  api.post(`/campaigns/meta/${brandId}/snapshot`, data)
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

// Extract brand from URL
export const extractBrandFromUrl = (url: string) => api.post('/extract/from-url', { url })

// AI provider status
export const getAiStatus = () => api.get('/dashboard/ai-status')

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
