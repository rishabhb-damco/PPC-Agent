import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getBrands } from '../services/api'

interface Brand {
  id: string
  name: string
  industry: string
  website: string
  competitors: string[]
  target_audience: string
  platforms: string[]
  analysis_status: string
  last_analysed: string | null
  approval_stats?: {
    pending: number
    high_impact_pending: number
  }
}

interface BrandContextType {
  brands: Brand[]
  activeBrand: Brand | null
  setActiveBrand: (b: Brand | null) => void
  refreshBrands: () => void
  loading: boolean
}

const BrandContext = createContext<BrandContextType>({
  brands: [],
  activeBrand: null,
  setActiveBrand: () => {},
  refreshBrands: () => {},
  loading: false,
})

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([])
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshBrands = () => {
    setLoading(true)
    getBrands()
      .then(r => {
        const list: Brand[] = r.data.brands
        setBrands(list)
        if (!activeBrand && list.length > 0) setActiveBrand(list[0])
        else if (activeBrand) {
          const updated = list.find(b => b.id === activeBrand.id)
          if (updated) setActiveBrand(updated)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refreshBrands()
    const interval = setInterval(refreshBrands, 8000) // poll every 8s while pipeline may be running
    return () => clearInterval(interval)
  }, [])

  return (
    <BrandContext.Provider value={{ brands, activeBrand, setActiveBrand, refreshBrands, loading }}>
      {children}
    </BrandContext.Provider>
  )
}

export const useBrand = () => useContext(BrandContext)
