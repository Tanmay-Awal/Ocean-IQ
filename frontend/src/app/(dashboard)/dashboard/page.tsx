"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { 
  Activity, 
  MapPin, 
  MessageSquare, 
  ArrowRight, 
  BarChart2, 
  Radio, 
  Compass, 
  Search, 
  Sparkles, 
  Download, 
  Layers,
  ChevronRight,
  Droplets,
  Thermometer
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CountUp } from "@/components/ui/count-up"
import { useTheme } from "@/lib/theme"
import dynamic from "next/dynamic"

const GlobeMap = dynamic(() => import("@/components/GlobeMap").then(mod => mod.GlobeMap), { 
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full rounded-2xl bg-surface-card/60 border border-border flex items-center justify-center text-slate-500 font-mono text-xs">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full border-2 border-ocean-cyan border-t-transparent animate-spin" />
        <span>Initializing 3D Bathymetric Globe...</span>
      </div>
    </div>
  )
})

import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts"

const FLOAT_COLORS: Record<string, string> = {
  "1902677": "#22d3ee",
  "2900230": "#38bdf8",
  "2900765": "#34d399",
  "2901092": "#f59e0b",
  "2902210": "#ec4899",
  "2902217": "#8b5cf6",
}

const getFloatColor = (wmo: string) => FLOAT_COLORS[wmo] ?? "#06b6d4"

function BarCustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload
    const color = getFloatColor(item.wmo)
    return (
      <div className="p-3.5 rounded-xl bg-surface-card/95 dark:bg-[#080f1d]/95 backdrop-blur-xl border border-border/90 shadow-2xl font-mono text-xs space-y-2 min-w-[210px] select-none">
        {/* Top Header with Color Dot & WMO */}
        <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white/20 shrink-0" style={{ backgroundColor: color }} />
            <span className="font-bold text-sm text-foreground tracking-tight">WMO {item.wmo}</span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            Active
          </span>
        </div>

        {/* Region */}
        <div className="text-[11px]">
          <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Sub-Basin</span>
          <span className="text-foreground font-semibold truncate block mt-0.5">{item.region || "Indian Ocean Basin"}</span>
        </div>

        {/* Soundings Count & Temp Metrics */}
        <div className="pt-1.5 border-t border-border/40 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-600 dark:text-slate-400 block text-[10px] font-medium">Soundings</span>
            <span className="font-bold text-ocean-cyan text-xs">
              {item.measurements_count != null ? Number(item.measurements_count).toLocaleString() : 0} pts
            </span>
          </div>
          {item.avg_temp != null && (
            <div>
              <span className="text-slate-600 dark:text-slate-400 block text-[10px] font-medium">Avg Temp</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-xs">
                {Number(item.avg_temp).toFixed(1)}°C
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }
  return null
}

function AreaCustomTooltip({ active, payload, label, wmo1, wmo2 }: any) {
  if (active && payload && payload.length) {
    const temp1 = payload[0]?.value
    const temp2 = payload[1]?.value
    const delta = (temp1 != null && temp2 != null) ? Math.abs(temp1 - temp2).toFixed(2) : null

    return (
      <div className="p-3.5 rounded-xl bg-surface-card/95 dark:bg-[#080f1d]/95 backdrop-blur-xl border border-border/90 shadow-2xl font-mono text-xs space-y-2 min-w-[210px] select-none">
        {/* Depth Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
          <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">Sounding Depth</span>
          <span className="font-bold text-foreground">{label}m</span>
        </div>

        {/* Float 1 Temperature */}
        {temp1 != null && (
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
              <span className="text-slate-800 dark:text-slate-300 font-semibold">
                {wmo1 ? `Float ${wmo1}` : "Float 1"}
              </span>
            </div>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {Number(temp1).toFixed(1)}°C
            </span>
          </div>
        )}

        {/* Float 2 Temperature */}
        {temp2 != null && (
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-ocean-cyan shrink-0" />
              <span className="text-slate-800 dark:text-slate-300 font-semibold">
                {wmo2 ? `Float ${wmo2}` : "Float 2"}
              </span>
            </div>
            <span className="font-bold text-ocean-cyan">
              {Number(temp2).toFixed(1)}°C
            </span>
          </div>
        )}

        {/* Delta Thermal Gradient */}
        {delta != null && (
          <div className="pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <span>Thermal ΔT:</span>
            <span className="font-bold text-foreground">{delta}°C</span>
          </div>
        )}
      </div>
    )
  }
  return null
}

const FALLBACK_FLOATS_DATA = [
  { wmo: "1902677", measurements_count: 9073, first_profile: "2003-01-01 00:00:00", last_profile: "2026-02-27 04:26:33+00", avg_latitude: -10.2118, avg_longitude: 79.4020, avg_temp: 11.0, avg_sal: 34.7, region: "Southern Indian Ocean", active: "Active" },
  { wmo: "2900230", measurements_count: 7168, first_profile: "2003-01-01 00:00:00", last_profile: "2025-09-20 00:00:00", avg_latitude: -2.1155, avg_longitude: 72.3982, avg_temp: 15.7, avg_sal: 35.0, region: "Southern Arabian Sea", active: "Active" },
  { wmo: "2900765", measurements_count: 5793, first_profile: "2003-01-01 00:00:00", last_profile: "2025-09-20 00:00:00", avg_latitude: 15.3904, avg_longitude: 88.1535, avg_temp: 15.5, avg_sal: 34.5, region: "Northern Bay of Bengal", active: "Active" },
  { wmo: "2901092", measurements_count: 13182, first_profile: "2003-01-01 00:00:00", last_profile: "2025-09-20 00:00:00", avg_latitude: -0.7668, avg_longitude: 90.2090, avg_temp: 16.1, avg_sal: 34.8, region: "Southern Bay of Bengal", active: "Active" },
  { wmo: "2902210", measurements_count: 214284, first_profile: "2003-01-01 00:00:00", last_profile: "2025-09-20 00:00:00", avg_latitude: 18.3435, avg_longitude: 65.6906, avg_temp: 10.9, avg_sal: 35.5, region: "Northern Arabian Sea", active: "Active" },
  { wmo: "2902217", measurements_count: 82899, first_profile: "2003-01-01 00:00:00", last_profile: "2025-09-20 00:00:00", avg_latitude: 17.3239, avg_longitude: 89.7645, avg_temp: 15.5, avg_sal: 34.5, region: "Northern Bay of Bengal", active: "Active" }
]

export default function DashboardPage() {
  const { isDark } = useTheme()
  const [data, setData] = useState<any[]>(FALLBACK_FLOATS_DATA)
  const [profileCurves, setProfileCurves] = useState<any>(null)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [regionFilter, setRegionFilter] = useState("all")

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    setLoading(true)

    // 1. Fetch float metadata immediately (populates HUD numbers & 3D Globe instantly)
    fetch(`${apiUrl}/api/floats`)
      .then(res => res.json())
      .then(json => {
        if (json?.floats?.length > 0) {
          setData(json.floats)
        }
      })
      .catch(err => console.error("Floats fetch caught:", err))
      .finally(() => setLoading(false))

    // 2. Fetch aggregated stats
    fetch(`${apiUrl}/api/dashboard/stats`)
      .then(res => res.json())
      .then(json => {
        if (json) {
          setDashboardStats(json)
          if (json.floats?.length > 0) {
            setData(prev => (prev.length === 0 ? json.floats : prev))
          }
        }
      })
      .catch(err => console.error("Dashboard stats fetch caught:", err))

    // 3. Fetch profile curves (computes vertical temperature sounding profile)
    fetch(`${apiUrl}/api/dashboard/profile-curves`)
      .then(res => res.json())
      .then(json => {
        if (json?.curves?.length > 0) {
          setProfileCurves(json)
        }
      })
      .catch(err => console.error("Profile curves fetch caught:", err))
  }, [])

  const stats = useMemo(() => {
    const totalProfiles = data.reduce((acc: number, f: any) => acc + (f.measurements_count || 0), 0)
    const activeCount = data.filter((f: any) => f.active === "Active" || f.status === "Active").length
    const regions = new Set(data.map((f: any) => f.region).filter(Boolean)).size
    const temps = data.map((f: any) => f.avg_temp).filter((t: any) => t != null && !Number.isNaN(t))
    const sals = data.map((f: any) => f.avg_sal).filter((s: any) => s != null && !Number.isNaN(s))
    const avgTemp = temps.length
      ? Number((temps.reduce((a: number, b: number) => a + b, 0) / temps.length).toFixed(1))
      : 0
    const avgSal = sals.length
      ? Number((sals.reduce((a: number, b: number) => a + b, 0) / sals.length).toFixed(1))
      : 0
    const uptime = data.length ? Math.round((activeCount / data.length) * 100) : 0

    return { totalProfiles, activeCount, regions, avgTemp, avgSal, uptime }
  }, [data])

  const regionsList = useMemo(() => {
    const list = Array.from(new Set(data.map((f: any) => f.region).filter(Boolean)))
    return ["all", ...list]
  }, [data])

  const filteredFloats = useMemo(() => {
    return data.filter((f: any) => {
      const matchesSearch = f.wmo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            f.region?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRegion = regionFilter === "all" || f.region === regionFilter
      return matchesSearch && matchesRegion
    })
  }, [data, searchQuery, regionFilter])

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Top Banner & Header in Modern Landing Page Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-white/10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0284c7] dark:text-cyan-400 tracking-[0.2em] uppercase">
            <span>REAL-TIME OCEANOGRAPHIC ARRAY</span>
            <span className="w-6 h-[1.5px] bg-[#0284c7]/60 dark:bg-cyan-400/60" />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#0c2340] dark:text-white">
              Ocean Telemetry Operations
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Array
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-normal max-w-2xl">
            Autonomous ARGO profiling float analytics, vertical CTD soundings, and 3D bathymetric trajectory monitoring across the Indian Ocean basin.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/explore">
            <button className="h-10 px-5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-[#0c2340] dark:text-white hover:bg-white dark:hover:bg-slate-800 text-xs sm:text-sm font-medium flex items-center gap-2 shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export Matrix</span>
            </button>
          </Link>
          <Link href="/chat">
            <button className="h-10 px-5 rounded-full bg-[#0c2340] hover:bg-[#07172b] dark:bg-white dark:text-[#0c2340] dark:hover:bg-slate-100 text-white text-xs sm:text-sm font-medium flex items-center gap-2 shadow-md shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 dark:text-[#0284c7]" />
              <span>Launch Aqua AI</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Top Frosted Glass Metric HUD with Animated Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Active Float Fleet */}
        <div className="group rounded-3xl bg-white/70 dark:bg-[#0a1222]/80 backdrop-blur-xl border border-white/90 dark:border-white/10 p-5 shadow-[0_10px_30px_rgba(2,132,199,0.06)] hover:shadow-[0_20px_45px_rgba(2,132,199,0.14)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Active Array</p>
            <h3 className="text-2xl sm:text-3xl font-bold font-mono text-[#0c2340] dark:text-white">
              <CountUp end={stats.activeCount} duration={1400} /> <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-sans">Units</span>
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
              <CountUp end={stats.uptime} duration={1200} suffix="% Fleet Operational" />
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-100/80 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800/50 flex items-center justify-center text-[#0284c7] dark:text-cyan-300 shrink-0 shadow-xs group-hover:scale-110 group-hover:bg-[#0284c7] group-hover:text-white transition-all duration-300">
            <Radio className="w-6 h-6" />
          </div>
        </div>

        {/* Total Profiles Soundings */}
        <div className="group rounded-3xl bg-white/70 dark:bg-[#0a1222]/80 backdrop-blur-xl border border-white/90 dark:border-white/10 p-5 shadow-[0_10px_30px_rgba(2,132,199,0.06)] hover:shadow-[0_20px_45px_rgba(2,132,199,0.14)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Indexed Profiles</p>
            <h3 className="text-2xl sm:text-3xl font-bold font-mono text-[#0c2340] dark:text-white">
              <CountUp end={stats.totalProfiles} separator="," duration={1800} /> <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-sans">Soundings</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 font-mono font-medium">
              <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />
              0m &rarr; 2000m Depth
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Mean Temperature */}
        <div className="group rounded-3xl bg-white/70 dark:bg-[#0a1222]/80 backdrop-blur-xl border border-white/90 dark:border-white/10 p-5 shadow-[0_10px_30px_rgba(2,132,199,0.06)] hover:shadow-[0_20px_45px_rgba(2,132,199,0.14)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Upper Basin Temp</p>
            <h3 className="text-2xl sm:text-3xl font-bold font-mono text-[#0c2340] dark:text-white">
              <CountUp end={stats.avgTemp} decimals={1} suffix="°C" duration={1600} />
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 font-mono font-medium">
              <Droplets className="w-3.5 h-3.5 text-sky-500" />
              Salinity: <CountUp end={stats.avgSal} decimals={1} suffix=" PSU" duration={1400} />
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100/80 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-xs group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
            <Thermometer className="w-6 h-6" />
          </div>
        </div>

        {/* Sub-Basin Coverage */}
        <div className="group rounded-3xl bg-white/70 dark:bg-[#0a1222]/80 backdrop-blur-xl border border-white/90 dark:border-white/10 p-5 shadow-[0_10px_30px_rgba(2,132,199,0.06)] hover:shadow-[0_20px_45px_rgba(2,132,199,0.14)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Spatial Coverage</p>
            <h3 className="text-2xl sm:text-3xl font-bold font-mono text-[#0c2340] dark:text-white">
              <CountUp end={stats.regions} duration={1200} /> <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-sans">Zones</span>
            </h3>
            <p className="text-xs text-[#0284c7] dark:text-cyan-400 flex items-center gap-1 font-mono font-medium">
              <MapPin className="w-3.5 h-3.5" />
              Indian Ocean Basin
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-100/80 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-xs group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
            <Compass className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Grid: 3D Bathymetric Globe + Analytical Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Globe Visualization */}
        <div className="lg:col-span-2 rounded-3xl bg-white/70 dark:bg-[#0a1222]/80 backdrop-blur-xl border border-white/90 dark:border-white/10 p-6 shadow-[0_10px_30px_rgba(2,132,199,0.06)] flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-[#0c2340] dark:text-white tracking-tight">
                Bathymetric Geospatial Explorer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Interactive 3D orthographic globe of autonomous ARGO profiling floats in the Indian Ocean
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950/80 text-[#0284c7] dark:text-cyan-300 border border-sky-200 dark:border-sky-800/50 font-mono text-[10px] font-semibold">
              Orthographic 3D
            </span>
          </div>
          <div className="pt-4">
            <GlobeMap floats={data} />
          </div>
        </div>

        {/* AI Research Dispatch & Quick Queries */}
        <div className="rounded-3xl bg-white/70 dark:bg-[#0a1222]/80 backdrop-blur-xl border border-white/90 dark:border-white/10 p-6 shadow-[0_10px_30px_rgba(2,132,199,0.06)] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#0284c7] to-[#06b6d4] text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-base font-bold text-[#0c2340] dark:text-white tracking-tight">
                  Aqua AI Dispatch
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#0284c7] dark:text-cyan-300 px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800/50 font-semibold">
                RAG Live
              </span>
            </div>

            {/* Array Calibration Banner */}
            <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">Array Telemetry</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Calibrated</span>
              </div>
              <div className="w-full bg-slate-200/70 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-[#0284c7] via-[#06b6d4] to-emerald-400 h-full w-full rounded-full" />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Thermodynamic calculations ready for Mixed Layer Depth (MLD) and pycnocline gradient detection.
              </p>
            </div>

            {/* Direct Quick Query Input Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.currentTarget
                const input = form.elements.namedItem('query') as HTMLInputElement
                if (input && input.value.trim()) {
                  window.location.href = `/chat?query=${encodeURIComponent(input.value.trim())}`
                }
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                name="query"
                placeholder="Ask Aqua anything (e.g. 'MLD for 2902217')..."
                className="w-full pl-4 pr-11 py-2.5 rounded-2xl text-xs font-mono bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-foreground placeholder:text-slate-400 focus:outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20 shadow-xs transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 w-7 h-7 rounded-xl bg-[#0c2340] dark:bg-white text-white dark:text-[#0c2340] hover:bg-[#07172b] dark:hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="Ask Aqua AI"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Suggested Scientific Queries */}
            <div className="pt-1">
              <p className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                Suggested Scientific Queries
              </p>
              <div className="flex flex-col gap-2">
                <QueryLink query="Calculate Mixed Layer Depth for WMO 2902217" />
                <QueryLink query="Plot a depth profile for float 2902210" />
                <QueryLink query="Compare salinity between WMO 2902210 and 2902217" />
                <QueryLink query="Show average temperature in Northern Arabian Sea" />
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <Link href="/chat">
              <button className="w-full h-11 px-5 rounded-2xl bg-[#0c2340] hover:bg-[#07172b] dark:bg-white dark:text-[#0c2340] dark:hover:bg-slate-100 text-white font-medium text-xs flex items-center justify-between shadow-md shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group">
                <span>Open Full Research Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </Link>
          </div>
        </div>

      </div>

      {/* Dual Scientific Charts: Vertical Depth Profile & Measurement Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CTD Vertical Temperature Curves */}
        <div className="rounded-3xl bg-white/70 dark:bg-[#0a1222]/80 backdrop-blur-xl border border-white/90 dark:border-white/10 p-6 shadow-[0_10px_30px_rgba(2,132,199,0.06)] flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-[#0c2340] dark:text-white tracking-tight">
                Vertical Temperature Profiles (CTD Soundings)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Averaged temperature curves binned at 50m intervals {profileCurves?.wmo1 ? `(WMO ${profileCurves.wmo1} vs WMO ${profileCurves.wmo2 || '—'})` : ''}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 text-[10px] font-mono font-semibold">
              CTD Thermocline
            </span>
          </div>
          <div className="h-[340px] pt-4">
            {profileCurves?.curves && profileCurves.curves.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                <AreaChart data={profileCurves.curves} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <defs>
                  <linearGradient id="colorTemp1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTemp2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDark ? "rgba(56, 189, 248, 0.08)" : "rgba(14, 165, 233, 0.12)"} 
                />
                <XAxis 
                  dataKey="depth" 
                  stroke={isDark ? "#475569" : "#64748b"} 
                  tick={{ fill: isDark ? '#64748b' : '#475569', fontSize: 11, fontFamily: 'var(--font-geist-mono)' }} 
                  tickLine={false} 
                  unit="m" 
                />
                <YAxis 
                  stroke={isDark ? "#475569" : "#64748b"} 
                  tick={{ fill: isDark ? '#64748b' : '#475569', fontSize: 11, fontFamily: 'var(--font-geist-mono)' }} 
                  tickLine={false} 
                  unit="°C" 
                />
                <Tooltip 
                  cursor={{ stroke: isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.4)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  content={<AreaCustomTooltip wmo1={profileCurves?.wmo1} wmo2={profileCurves?.wmo2} />}
                />
                <Area 
                  type="monotone" 
                  dataKey="temp1" 
                  name={profileCurves?.wmo1 ? `Float ${profileCurves.wmo1}` : "Float 1"} 
                  stroke="#8b5cf6" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorTemp1)" 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="temp2" 
                  name={profileCurves?.wmo2 ? `Float ${profileCurves.wmo2}` : "Float 2"} 
                  stroke="#0284c7" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorTemp2)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs font-mono text-slate-500 gap-2">
                <Activity className="w-5 h-5 text-purple-500 animate-pulse" />
                <span>No vertical profile curves synced from telemetry</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Records Distribution */}
        <div className="rounded-3xl bg-white/70 dark:bg-[#0a1222]/80 backdrop-blur-xl border border-white/90 dark:border-white/10 p-6 shadow-[0_10px_30px_rgba(2,132,199,0.06)] flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-[#0c2340] dark:text-white tracking-tight">
                Telemetry Records Volume by Float
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                High-density measurement soundings count per autonomous profiling float
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950/80 text-[#0284c7] dark:text-cyan-300 border border-sky-200 dark:border-sky-800/50 text-[10px] font-mono font-semibold">
              Records / Node
            </span>
          </div>
          <div className="h-[340px] pt-4">
            {data && data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                <BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? "rgba(56, 189, 248, 0.08)" : "rgba(14, 165, 233, 0.12)"} 
                  />
                  <XAxis 
                    dataKey="wmo" 
                    stroke={isDark ? "#475569" : "#64748b"} 
                    tick={{ fill: isDark ? '#64748b' : '#475569', fontSize: 11, fontFamily: 'var(--font-geist-mono)' }} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke={isDark ? "#475569" : "#64748b"} 
                    tick={{ fill: isDark ? '#64748b' : '#475569', fontSize: 11, fontFamily: 'var(--font-geist-mono)' }} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    cursor={{ fill: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.06)', radius: 8 }}
                    content={<BarCustomTooltip />}
                  />
                  <Bar 
                    dataKey="measurements_count" 
                    radius={[8, 8, 0, 0]}
                    animationDuration={1500}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getFloatColor(entry.wmo)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs font-mono text-slate-500 gap-2">
                <Radio className="w-5 h-5 text-[#0284c7] animate-pulse" />
                <span>No autonomous float measurements indexed</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Float Telemetry Inventory Section with Search & Filtering */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-serif text-[#0c2340] dark:text-white tracking-tight flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#0284c7]" />
              Autonomous Float Array Inventory
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Showing {filteredFloats.length} of {data.length} telemetry units in database
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search WMO or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 pr-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-xs text-foreground placeholder:text-slate-400 focus:outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20 w-48 sm:w-60 shadow-xs font-mono"
              />
            </div>

            {/* Region Filter */}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="h-10 px-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-xs text-foreground focus:outline-none focus:border-[#0284c7] cursor-pointer shadow-xs font-medium"
            >
              {regionsList.map((r) => (
                <option key={r} value={r}>
                  {r === "all" ? "All Ocean Zones" : r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Float Cards Grid */}
        {filteredFloats.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white/60 dark:bg-[#0a1222]/60 border border-slate-200/60 dark:border-white/10 text-center text-xs font-mono text-slate-500">
            No autonomous float profiles found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredFloats.map((float: any) => {
              const color = getFloatColor(float.wmo)
              const firstYear = float.first_profile ? float.first_profile.split("-")[0] : "—"
              const lastYear = float.last_profile ? float.last_profile.split("-")[0] : "—"

            return (
              <div 
                key={float.wmo} 
                className="group rounded-3xl bg-white/70 dark:bg-[#0a1222]/80 backdrop-blur-xl border border-white/90 dark:border-white/10 p-5 shadow-[0_8px_24px_rgba(2,132,199,0.05)] hover:shadow-[0_16px_36px_rgba(2,132,199,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                        ARGO Profiler
                      </span>
                      <p className="text-xl font-bold font-mono text-[#0c2340] dark:text-white tracking-tight flex items-center gap-2 mt-0.5">
                        <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white/30 shrink-0" style={{ backgroundColor: color }} />
                        {float.wmo}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {float.active || "Active"}
                    </span>
                  </div>

                  {/* Metadata List */}
                  <div className="space-y-2 text-xs font-mono font-medium">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Region</span>
                      <span className="text-[#0c2340] dark:text-white font-bold truncate max-w-[150px]" title={float.region}>
                        {float.region}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Measurements</span>
                      <span className="text-[#0284c7] dark:text-cyan-400 font-bold">
                        <CountUp end={float.measurements_count || 0} separator="," duration={1200} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Profile Span</span>
                      <span className="text-slate-700 dark:text-slate-200 font-semibold">
                        {firstYear} &rarr; {lastYear}
                      </span>
                    </div>
                  </div>

                  {/* Temperature & Salinity Pill */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/10 text-center font-mono">
                    <div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Avg Temp</p>
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                        {float.avg_temp != null ? `${float.avg_temp.toFixed(1)}°C` : "N/A"}
                      </p>
                    </div>
                    <div className="border-l border-slate-200 dark:border-slate-800">
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Avg Sal</p>
                      <p className="text-xs font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                        {float.avg_sal != null ? `${float.avg_sal.toFixed(1)} PSU` : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Link href={`/chat?query=${encodeURIComponent(`Analyze float ${float.wmo} thermodynamic parameters and MLD`)}`}>
                      <button className="w-full py-2 px-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-[#0284c7] hover:text-white border border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]">
                        <MessageSquare className="w-3.5 h-3.5 text-[#0284c7] group-hover:text-white transition-colors" />
                        <span>Analyze</span>
                      </button>
                    </Link>
                    <Link href={`/chat?query=${encodeURIComponent(`Plot a vertical depth profile for float ${float.wmo}`)}`}>
                      <button className="w-full py-2 px-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-purple-600 hover:text-white border border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]">
                        <BarChart2 className="w-3.5 h-3.5 text-purple-600 group-hover:text-white transition-colors" />
                        <span>Graph</span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        )}
      </div>

    </div>
  )
}

function QueryLink({ query }: { query: string }) {
  return (
    <Link href={`/chat?query=${encodeURIComponent(query)}`} className="block w-full">
      <div className="group flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 dark:hover:border-sky-800 transition-all cursor-pointer shadow-xs">
        <span className="text-xs text-slate-700 dark:text-slate-200 font-medium group-hover:text-[#0284c7] dark:group-hover:text-cyan-300 transition-colors truncate pr-2">
          {query}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0284c7] dark:group-hover:text-cyan-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
