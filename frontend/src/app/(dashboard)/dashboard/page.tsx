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

export default function DashboardPage() {
  const { isDark } = useTheme()
  const [data, setData] = useState<any[]>([])
  const [profileCurves, setProfileCurves] = useState<any>(null)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [regionFilter, setRegionFilter] = useState("all")

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    setLoading(true)
    Promise.all([
      fetch(`${apiUrl}/api/floats`).then(res => res.json()).catch(() => null),
      fetch(`${apiUrl}/api/dashboard/profile-curves`).then(res => res.json()).catch(() => null),
      fetch(`${apiUrl}/api/dashboard/stats`).then(res => res.json()).catch(() => null)
    ])
      .then(([floatsJson, curvesJson, statsJson]) => {
        if (floatsJson && floatsJson.floats && floatsJson.floats.length > 0) {
          setData(floatsJson.floats)
        }
        if (curvesJson && curvesJson.curves && curvesJson.curves.length > 0) {
          setProfileCurves(curvesJson)
        }
        if (statsJson) {
          setDashboardStats(statsJson)
        }
      })
      .catch(err => {
        console.error("Dashboard stats fetch caught:", err)
      })
      .finally(() => {
        setLoading(false)
      })
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
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Ocean Telemetry Operations
            </h1>
            <Badge variant="active" dot>Array Synced</Badge>
          </div>
          <p className="text-sm text-slate-800 dark:text-slate-300 font-medium">
            Real-time physical oceanography analytics, vertical CTD soundings, and ARGO float trajectory monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/explore">
            <Button variant="secondary" size="sm" className="text-xs hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Export Datasets
            </Button>
          </Link>
          <Link href="/chat">
            <Button variant="cyan" size="sm" className="text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Ask Aqua AI
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Calibrated Metric HUD with Animated Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Float Fleet */}
        <Card variant="elevated" className="card-hover-lift">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-mono text-slate-800 dark:text-slate-400 uppercase tracking-wider font-semibold">Active Array</p>
              <h3 className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
                <CountUp end={stats.activeCount} duration={1400} /> <span className="text-xs font-normal text-slate-600 dark:text-slate-400 font-sans font-medium">Units</span>
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                <CountUp end={stats.uptime} duration={1200} suffix="% Fleet Operational" />
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-ocean-cyan/10 border border-ocean-cyan/20 flex items-center justify-center text-ocean-cyan shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-transform duration-300 hover:rotate-12">
              <Radio className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Total Profiles Soundings */}
        <Card variant="elevated" className="card-hover-lift">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-mono text-slate-800 dark:text-slate-400 uppercase tracking-wider font-semibold">Indexed Profiles</p>
              <h3 className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
                <CountUp end={stats.totalProfiles} separator="," duration={1800} /> <span className="text-xs font-normal text-slate-600 dark:text-slate-400 font-sans font-medium">Soundings</span>
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-400 flex items-center gap-1 font-mono font-medium">
                <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />
                0m &rarr; 2000m Depth
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-transform duration-300 hover:rotate-12">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Mean Temperature */}
        <Card variant="elevated" className="card-hover-lift">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-mono text-slate-800 dark:text-slate-400 uppercase tracking-wider font-semibold">Upper Basin Temp</p>
              <h3 className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
                <CountUp end={stats.avgTemp} decimals={1} suffix="°C" duration={1600} />
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-400 flex items-center gap-1 font-mono font-medium">
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
                Salinity: <CountUp end={stats.avgSal} decimals={1} suffix=" PSU" duration={1400} />
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-transform duration-300 hover:rotate-12">
              <Thermometer className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Sub-Basin Coverage */}
        <Card variant="elevated" className="card-hover-lift">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-mono text-slate-800 dark:text-slate-400 uppercase tracking-wider font-semibold">Spatial Coverage</p>
              <h3 className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
                <CountUp end={stats.regions} duration={1200} /> <span className="text-xs font-normal text-slate-600 dark:text-slate-400 font-sans font-medium">Zones</span>
              </h3>
              <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 font-mono font-medium">
                <MapPin className="w-3.5 h-3.5" />
                Indian Ocean Basin
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-transform duration-300 hover:rotate-12">
              <Compass className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Grid: 3D Bathymetric Globe + Analytical Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Globe Visualization */}
        <Card variant="elevated" className="lg:col-span-2 card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Bathymetric Geospatial Explorer
              </CardTitle>
              <CardDescription>
                Interactive 3D orthographic globe of autonomous ARGO profiling floats in the Indian Ocean
              </CardDescription>
            </div>
            <Badge variant="cyan" className="font-mono text-[10px]">Orthographic 3D</Badge>
          </CardHeader>
          <CardContent>
            <GlobeMap floats={data} />
          </CardContent>
        </Card>

        {/* AI Research Dispatch & Quick Queries */}
        <Card variant="elevated" className="flex flex-col justify-between card-hover-lift">
          <div className="space-y-3.5">
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-ocean-cyan" />
                  Aqua AI Dispatch
                </CardTitle>
                <span className="text-[10px] font-mono text-ocean-cyan px-2 py-0.5 rounded-full bg-ocean-cyan/10 border border-ocean-cyan/20">
                  RAG Live
                </span>
              </div>
              <CardDescription>
                Execute conversational queries with spatial SQL translation
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              {/* Array Calibration Banner */}
              <div className="rounded-xl bg-surface-elevated/70 border border-border/60 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-800 dark:text-slate-400 font-semibold">Array Telemetry</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Calibrated</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-ocean-cyan to-emerald-400 h-full w-full rounded-full" />
                </div>
                <p className="text-[11px] text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
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
                  className="w-full pl-3.5 pr-10 py-2 rounded-xl text-xs font-mono bg-surface-base border border-border text-foreground placeholder:text-slate-400 focus:outline-none focus:border-ocean-cyan/60 focus:ring-1 focus:ring-ocean-cyan/30 shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 w-6 h-6 rounded-lg bg-ocean-cyan/20 hover:bg-ocean-cyan text-ocean-cyan hover:text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
                  title="Ask Aqua AI"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Suggested Scientific Queries with Distinct Gap and Padding */}
              <div className="pt-1">
                <p className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                  Suggested Scientific Queries
                </p>
                <div className="flex flex-col gap-2.5">
                  <QueryLink query="Calculate Mixed Layer Depth for WMO 2902217" />
                  <QueryLink query="Plot a depth profile for float 2902210" />
                  <QueryLink query="Compare salinity between WMO 2902210 and 2902217" />
                  <QueryLink query="Show average temperature in Northern Arabian Sea" />
                  <QueryLink query="Explain the ΔT = 0.2°C threshold method" />
                </div>
              </div>

              {/* Intelligence Pipeline Capabilities Chips */}
              <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-2 rounded-lg bg-surface-elevated/70 border border-border/50">
                  <span className="text-slate-500 block font-medium">LLM Reasoning</span>
                  <span className="text-foreground font-bold">Gemini 2.0 Thinking</span>
                </div>
                <div className="p-2 rounded-lg bg-surface-elevated/70 border border-border/50">
                  <span className="text-slate-500 block font-medium">Vector Index</span>
                  <span className="text-ocean-cyan font-bold">ChromaDB Synced</span>
                </div>
              </div>
            </CardContent>
          </div>

          <div className="p-6 pt-2">
            <Link href="/chat">
              <Button variant="cyan" className="w-full justify-between group shadow-md hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <span>Open Full Research Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
        </Card>

      </div>

      {/* Dual Scientific Charts: Vertical Depth Profile & Measurement Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CTD Vertical Temperature Curves */}
        <Card variant="elevated" className="card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Vertical Temperature Profiles (CTD Soundings)
              </CardTitle>
              <CardDescription>
                Averaged temperature curves binned at 50m intervals {profileCurves?.wmo1 ? `(WMO ${profileCurves.wmo1} vs WMO ${profileCurves.wmo2 || '—'})` : ''}
              </CardDescription>
            </div>
            <Badge variant="mld" className="text-[10px] font-mono">CTD Thermocline</Badge>
          </CardHeader>
          <CardContent className="h-[340px]">
            {profileCurves?.curves && profileCurves.curves.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                <AreaChart data={profileCurves.curves} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <defs>
                  <linearGradient id="colorTemp1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTemp2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
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
                  stroke="#06b6d4" 
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
          </CardContent>
        </Card>

        {/* Profile Records Distribution */}
        <Card variant="elevated" className="card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Telemetry Records Volume by Float
              </CardTitle>
              <CardDescription>
                High-density measurement soundings count per autonomous profiling float
              </CardDescription>
            </div>
            <Badge variant="cyan" className="text-[10px] font-mono">Records / Node</Badge>
          </CardHeader>
          <CardContent className="h-[340px]">
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
                <Radio className="w-5 h-5 text-ocean-cyan animate-pulse" />
                <span>No autonomous float measurements indexed</span>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Float Telemetry Inventory Section with Search & Filtering */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              <Radio className="w-4 h-4 text-ocean-cyan" />
              Autonomous Float Array Inventory
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">
              Showing {filteredFloats.length} of {data.length} telemetry units in database
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search WMO or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-3 rounded-xl bg-surface-card border border-border text-xs text-foreground placeholder:text-slate-500 focus:outline-none focus:border-ocean-cyan/50 focus:ring-1 focus:ring-ocean-cyan/20 w-48 sm:w-60 shadow-sm font-medium"
              />
            </div>

            {/* Region Filter */}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="h-9 px-3 rounded-xl bg-surface-card border border-border text-xs text-foreground focus:outline-none focus:border-ocean-cyan/50 cursor-pointer shadow-sm font-medium"
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
          <div className="p-8 rounded-2xl bg-surface-card border border-border text-center text-xs font-mono text-slate-500">
            No autonomous float profiles found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFloats.map((float: any) => {
              const color = getFloatColor(float.wmo)
              const firstYear = float.first_profile ? float.first_profile.split("-")[0] : "—"
              const lastYear = float.last_profile ? float.last_profile.split("-")[0] : "—"

            return (
              <Card 
                key={float.wmo} 
                variant="subtle"
                className="card-hover-lift flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-700 dark:text-slate-400 font-semibold">
                        ARGO Profiler
                      </span>
                      <p className="text-xl font-bold font-mono text-foreground tracking-tight flex items-center gap-2 mt-0.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        {float.wmo}
                      </p>
                    </div>
                    <Badge variant="active" dot className="text-[10px]">
                      {float.active || "Active"}
                    </Badge>
                  </div>

                  {/* Metadata List */}
                  <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-mono font-medium">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Region</span>
                      <span className="text-foreground font-bold truncate max-w-[150px]" title={float.region}>
                        {float.region}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Measurements</span>
                      <span className="text-ocean-cyan font-bold">
                        <CountUp end={float.measurements_count || 0} separator="," duration={1200} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Profile Span</span>
                      <span className="text-foreground font-semibold">
                        {firstYear} &rarr; {lastYear}
                      </span>
                    </div>
                  </div>

                  {/* Temperature & Salinity Pill */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-surface-elevated/70 border border-border/50 text-center font-mono">
                    <div>
                      <p className="text-[9px] text-slate-700 dark:text-slate-400 uppercase font-semibold">Avg Temp</p>
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-300 mt-0.5">
                        {float.avg_temp != null ? `${float.avg_temp.toFixed(1)}°C` : "N/A"}
                      </p>
                    </div>
                    <div className="border-l border-border/50">
                      <p className="text-[9px] text-slate-700 dark:text-slate-400 uppercase font-semibold">Avg Sal</p>
                      <p className="text-xs font-bold text-sky-600 dark:text-sky-300 mt-0.5">
                        {float.avg_sal != null ? `${float.avg_sal.toFixed(1)} PSU` : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                    <Link href={`/chat?query=${encodeURIComponent(`Analyze float ${float.wmo} thermodynamic parameters and MLD`)}`}>
                      <button className="w-full py-2 px-2.5 rounded-lg bg-surface-card hover:bg-ocean-cyan/15 border border-border hover:border-ocean-cyan/40 text-slate-900 dark:text-slate-200 hover:text-ocean-cyan text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                        <MessageSquare className="w-3.5 h-3.5 text-ocean-cyan" />
                        <span>Analyze</span>
                      </button>
                    </Link>
                    <Link href={`/chat?query=${encodeURIComponent(`Plot a vertical depth profile for float ${float.wmo}`)}`}>
                      <button className="w-full py-2 px-2.5 rounded-lg bg-surface-card hover:bg-purple-500/15 border border-border hover:border-purple-500/40 text-slate-900 dark:text-slate-200 hover:text-purple-400 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                        <BarChart2 className="w-3.5 h-3.5 text-purple-500" />
                        <span>Graph</span>
                      </button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
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
      <div className="group flex items-center justify-between px-3.5 py-3 rounded-xl border border-border/80 bg-surface-card hover:bg-ocean-cyan/10 hover:border-ocean-cyan/40 transition-all cursor-pointer card-hover-lift shadow-sm">
        <span className="text-xs text-slate-900 dark:text-slate-200 font-medium group-hover:text-ocean-cyan transition-colors truncate pr-2">
          {query}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-ocean-cyan shrink-0 transition-all group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
