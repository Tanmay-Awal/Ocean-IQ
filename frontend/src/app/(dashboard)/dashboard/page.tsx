"use client"
import { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { Activity, Battery, MapPin, Zap, MessageSquare, ArrowRight, TrendingUp, BarChart2, Bell } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"

const GlobeMap = dynamic(() => import("@/components/GlobeMap").then(mod => mod.GlobeMap), { ssr: false })
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const FLOAT_COLORS: Record<string, string> = {
  "1902677": "#22d3ee",
  "2900230": "#0ea5e9",
  "2900765": "#10b981",
  "2901092": "#eab308",
  "2902210": "#ec4899",
  "2902217": "#8b5cf6",
};
const getFloatColor = (wmo: string) => FLOAT_COLORS[wmo] ?? "#38bdf8";



export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [profileCurves, setProfileCurves] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    Promise.all([
      fetch(`${apiUrl}/api/floats`).then(res => res.json()),
      fetch(`${apiUrl}/api/dashboard/profile-curves`).then(res => res.json())
    ])
      .then(([floatsJson, curvesJson]) => {
        setData(floatsJson.floats || [])
        setProfileCurves(curvesJson)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch dashboard stats", err)
        setLoading(false)
      })
  }, [])

  const stats = useMemo(() => {
    if (!data) return null;
    const totalProfiles = data.reduce((acc: number, f: any) => acc + (f.measurements_count || 0), 0);
    const activeCount = data.filter((f: any) => f.active === "Active").length;
    const regions = new Set(data.map((f: any) => f.region)).size;
    const temps = data.map((f: any) => f.avg_temp).filter((t: any) => t != null && !Number.isNaN(t));
    const sals = data.map((f: any) => f.avg_sal).filter((s: any) => s != null && !Number.isNaN(s));
    const avgTemp = temps.length
      ? (temps.reduce((a: number, b: number) => a + b, 0) / temps.length).toFixed(1)
      : "—";
    const avgSal = sals.length
      ? (sals.reduce((a: number, b: number) => a + b, 0) / sals.length).toFixed(1)
      : "—";
    const uptime = data.length
      ? Math.round((activeCount / data.length) * 100)
      : 0;

    return { totalProfiles, activeCount, regions, avgTemp, avgSal, uptime };
  }, [data]);

  const chartsRef = useRef<HTMLDivElement>(null)
  const [chartsInView, setChartsInView] = useState(false)

  useEffect(() => {
    if (loading || !chartsRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setChartsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(chartsRef.current)

    return () => observer.disconnect()
  }, [loading])

  if (loading) {
    return (
      <div className="space-y-8 pb-8 animate-fade-in-up">
        <div>
          <div className="h-9 w-64 bg-slate-700/50 rounded-lg animate-pulse mb-2"></div>
          <div className="h-5 w-96 bg-slate-800/80 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[104px] bg-slate-800/60 border border-slate-700/50 rounded-xl animate-pulse shadow-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[500px] bg-slate-800/60 border border-slate-700/50 rounded-xl animate-pulse shadow-lg"></div>
          <div className="h-[500px] bg-slate-800/60 border border-slate-700/50 rounded-xl animate-pulse shadow-lg"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[400px] bg-slate-800/60 border border-slate-700/50 rounded-xl animate-pulse shadow-lg"></div>
          <div className="h-[400px] bg-slate-800/60 border border-slate-700/50 rounded-xl animate-pulse shadow-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Ocean Analytics</h1>
        <p className="text-slate-400">Monitor your global float network and analyze environmental trends.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
        <StatCard title="Active Floats" value={<CountUp end={stats?.activeCount || 0} />} description={<>{<CountUp end={stats?.uptime || 0} />}% fleet operational</>} icon={<Activity className="text-ocean-cyan" />} />
        <StatCard title="Total Profiles" value={<CountUp end={stats?.totalProfiles || 0} separator="," />} description="Indexed measurement records" icon={<BarChart2 className="text-emerald-400" />} />
        <StatCard title="Ocean Averages" value={stats?.avgTemp !== "—" ? <><CountUp end={parseFloat(stats?.avgTemp || "0")} decimals={1} />°C</> : "N/A"} description={<>Salinity <CountUp end={parseFloat(stats?.avgSal || "0")} decimals={1} /> PSU</>} icon={<TrendingUp className="text-yellow-400" />} />
        <StatCard title="Regions Covered" value={<CountUp end={stats?.regions || 0} />} description="Distinct oceanographic zones" icon={<MapPin className="text-purple-400" />} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up delay-100">
        
        {/* Geographic Visualization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Global Float Trajectories</CardTitle>
            <CardDescription>Interactive 3D map of active oceanographic floats</CardDescription>
          </CardHeader>
          <CardContent>
            <GlobeMap floats={data || []} />
          </CardContent>
        </Card>

        {/* Quick AI Queries */}
        <Card>
          <CardHeader>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>Quick analytical queries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-6">
              <h3 className="text-[15px] font-bold text-white mb-3 tracking-wide">Telemetry & Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-4 flex justify-between items-center shadow-lg cursor-pointer hover:border-slate-700 transition-colors">
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Coverage Rate</p>
                    <p className="text-xl font-bold text-white leading-tight mt-1"><CountUp end={stats?.uptime || 0} />%</p>
                    <p className="text-[10px] text-slate-500 mt-1">Optimal</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-ocean-cyan flex items-center justify-center bg-ocean-cyan/10 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    <Activity className="w-5 h-5 text-ocean-cyan animate-pulse" />
                  </div>
                </div>
                
                <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-4 flex justify-between items-center shadow-lg hover:border-slate-700 transition-colors cursor-pointer">
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Uplink Syncs</p>
                    <p className="text-xl font-bold text-white leading-tight mt-1"><CountUp end={stats?.regions || 4} /> Passes</p>
                    <p className="text-[10px] text-slate-500 mt-1">Sync verified</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-400 flex items-center justify-center bg-emerald-400/10 shrink-0 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                    <Bell className="w-5 h-5 text-emerald-400 animate-bounce m-auto" style={{ animationDuration: '3s' }} />
                  </div>
                </div>
              </div>
            </div>

            <QueryCard query="Show latest float activity" />
            <QueryCard query="Analyze temperature anomalies" />
            <QueryCard query="Compare Atlantic vs Pacific" />
            <QueryCard query="Summarize coverage gaps" />
            <Link href="/chat">
              <Button className="w-full mt-4 cursor-pointer" variant="glass">
                Open Full Chat <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up delay-200">
        <Card className="bg-slate-900/40 border-slate-800 hover:border-slate-600 transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] group">
          <CardHeader>
            <CardTitle className="text-white group-hover:text-purple-400 transition-colors">AI Insights Preview</CardTitle>
            <CardDescription className="text-slate-500">Average vertical profile curves</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartsInView ? (
                <AreaChart data={profileCurves?.curves || []} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTemp2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="depth" stroke="#475569" tick={{fill: '#475569', fontSize: 11}} tickLine={false} axisLine={{stroke: '#334155'}} type="number" domain={[0, 'dataMax']} ticks={[0, 200, 400, 600, 800, 1000]} />
                  <YAxis stroke="#475569" tick={{fill: '#475569', fontSize: 11}} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff', fontWeight: 500 }} />
                  <Area type="monotone" dataKey="temp1" name={profileCurves?.wmo1 ? `WMO ${profileCurves.wmo1}` : "Profile A"} stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTemp1)" activeDot={{ r: 7, fill: "#8b5cf6", stroke: "#0f172a", strokeWidth: 2 }} animationDuration={1500} />
                  <Area type="monotone" dataKey="temp2" name={profileCurves?.wmo2 ? `WMO ${profileCurves.wmo2}` : "Profile B"} stroke="#22d3ee" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTemp2)" activeDot={{ r: 7, fill: "#22d3ee", stroke: "#0f172a", strokeWidth: 2 }} animationDuration={1500} />
                </AreaChart>
              ) : (
                <div className="w-full h-full" />
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 hover:border-slate-600 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] group">
          <CardHeader>
            <CardTitle className="text-white group-hover:text-cyan-400 transition-colors">Profiles Density</CardTitle>
            <CardDescription className="text-slate-500">Total profile records per float</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[320px] items-end gap-2 sm:gap-4 px-2">
              {data?.map((float: any) => {
                const maxCount = Math.max(...(data?.map((f: any) => f.measurements_count) || [1]));
                const pct = (float.measurements_count / maxCount) * 85;
                const color = getFloatColor(float.wmo);
                return (
                  <div
                    key={float.wmo}
                    className="group/bar relative flex h-full flex-1 flex-col items-center justify-end gap-1 cursor-pointer"
                  >
                    <span className="text-[10px] font-medium text-slate-400 select-none mb-1 opacity-80 group-hover/bar:opacity-100 group-hover/bar:text-white group-hover/bar:-translate-y-1 transition-all duration-300">
                      {float.measurements_count >= 1000 ? (float.measurements_count / 1000).toFixed(0) + 'k' : float.measurements_count}
                    </span>
                    <div
                      className="w-full max-w-[45px] rounded-t-sm transition-all duration-1000 ease-out opacity-90 group-hover/bar:opacity-100 group-hover/bar:brightness-125"
                      style={{
                        height: chartsInView ? `${Math.max(pct, 2)}%` : '0%',
                        backgroundColor: color,
                        boxShadow: chartsInView ? `0 -4px 12px ${color}33` : 'none'
                      }}
                    />
                    <div className="w-full border-t border-slate-700/50 mt-1 mb-1 group-hover/bar:border-slate-500 transition-colors" />
                    
                    <div className="relative w-full flex justify-center">
                      <span className="max-w-full text-center text-[9px] font-medium text-slate-500 line-clamp-1 group-hover/bar:text-white transition-colors cursor-pointer">
                        WMO {float.wmo}
                      </span>
                      
                      {/* Region Tooltip */}
                      <div className="absolute bottom-full mb-1 opacity-0 group-hover/bar:opacity-100 group-hover/bar:-translate-y-1 transition-all duration-300 bg-slate-900 border border-slate-700 text-slate-200 text-[10px] px-2.5 py-1.5 rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.5)] whitespace-nowrap z-50 pointer-events-none flex flex-col items-center font-medium">
                        {float.region}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory */}
      <section className="space-y-4 pt-4 animate-fade-in-up delay-300">
        <h2 className="text-lg font-semibold text-white">Database Profiles Inventory</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.map((float: any) => {
            const firstYear = float.first_profile?.split("-")[0] ?? "—";
            const lastYear = float.last_profile?.split("-")[0] ?? "—";

            return (
              <div key={float.wmo} className="flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm transition-all hover:border-slate-700 hover:bg-slate-900/80 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">WMO Float</p>
                    <p className="text-xl font-semibold text-white mt-0.5 tracking-tight">{float.wmo}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${float.active === "Active"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-slate-800 text-slate-500 border border-slate-700"
                      }`}
                  >
                    {float.active}
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-.554-8.243-1.582m16.5 0a9.003 9.003 0 01-15.686 0z" />
                    </svg>
                    <span className="truncate">Region: <span className="text-slate-300 font-medium">{float.region}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                    <span>Profiles count: <span className="text-slate-300 font-medium"><CountUp end={float.measurements_count || 0} separator="," /></span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <span>Span: <span className="text-slate-300 font-medium">{firstYear} &rarr; {lastYear}</span></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800/80 bg-slate-950/40 p-3 mt-1">
                  <div className="text-center relative">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Temp (Avg)</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">{float.avg_temp != null && !Number.isNaN(float.avg_temp) ? <><CountUp end={float.avg_temp} decimals={1} />°C</> : "N/A"}</p>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-6 bg-slate-800/80"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Sal (Avg)</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">{float.avg_sal != null && !Number.isNaN(float.avg_sal) ? <CountUp end={float.avg_sal} decimals={1} /> : "N/A"}</p>
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-3 pt-2">
                  <Link href={`/chat?query=Analyze float ${float.wmo}`} className="block">
                    <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/40 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white hover:border-slate-600 cursor-pointer">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Analyze
                    </button>
                  </Link>
                  <Link href={`/chat?query=Plot a depth profile for float ${float.wmo}`} className="block">
                    <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-transparent bg-transparent py-2.5 text-xs font-medium text-slate-500 transition hover:border-slate-800 hover:bg-slate-900/50 hover:text-slate-300 cursor-pointer">
                      <BarChart2 className="w-3.5 h-3.5" />
                      Graph
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  )
}

function StatCard({ title, value, description, icon }: any) {
  return (
    <Card className="hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group cursor-pointer">
      <CardContent className="p-6 flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-ocean-dark border border-border flex shrink-0 items-center justify-center group-hover:scale-110 group-hover:border-slate-700 transition-all duration-300">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-400 font-medium truncate">{title}</p>
          <h4 className="text-2xl font-bold text-white truncate">{value}</h4>
          {description && <p className="text-xs text-slate-500 mt-1 truncate">{description}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function QueryCard({ query }: { query: string }) {
  return (
    <Link href={`/chat?query=${encodeURIComponent(query)}`}>
      <div className="group p-3 rounded-lg border border-border bg-ocean-dark/30 hover:bg-ocean-blue/10 hover:border-ocean-blue/30 transition-all cursor-pointer flex items-center justify-between mb-3 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:translate-x-1">
        <span className="text-sm text-slate-300 group-hover:text-ocean-cyan">{query}</span>
        <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-ocean-cyan transition-colors" />
      </div>
    </Link>
  )
}

function CountUp({ end, suffix = "", prefix = "", decimals = 0, separator = "" }: { end: number, suffix?: string, prefix?: string, decimals?: number, separator?: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const incrementTime = 16;
    const totalSteps = Math.round(duration / incrementTime);
    let currentStep = 0;
    
    if (end === 0) return;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / totalSteps;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setCount(end * easeOutQuart);
      
      if (currentStep >= totalSteps) {
        setCount(end);
        clearInterval(timer);
      }
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [end]);
  
  const formatted = count.toFixed(decimals);
  const withSeparator = separator ? formatted.replace(/\B(?=(\d{3})+(?!\d))/g, separator) : formatted;
  
  return <>{prefix}{withSeparator}{suffix}</>;
}
