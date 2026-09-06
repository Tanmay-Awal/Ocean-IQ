"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ArrowRightLeft, 
  Download, 
  Database, 
  Calendar, 
  ChevronDown, 
  Check, 
  Activity, 
  Droplets, 
  Waves, 
  Sparkles, 
  Thermometer, 
  Layers, 
  RefreshCw, 
  Table as TableIcon 
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type FloatMetadata = {
  wmo: string
  region: string
  active: string
  measurements_count?: number
}

type FloatStats = {
  wmo: string
  temp_min: number
  temp_max: number
  temp_avg: number
  sal_min: number
  sal_max: number
  sal_avg: number
  mld: any
  thermocline: any
  measurements_count: number
}

export default function ExplorePage() {
  const [floats, setFloats] = useState<FloatMetadata[]>([])
  const [loadingFloats, setLoadingFloats] = useState(false)

  // Comparison State
  const [floatA, setFloatA] = useState<string>("")
  const [floatB, setFloatB] = useState<string>("")
  const [statsA, setStatsA] = useState<FloatStats | null>(null)
  const [statsB, setStatsB] = useState<FloatStats | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [compareError, setCompareError] = useState<string | null>(null)

  // Data Preview State
  const [previewData, setPreviewData] = useState<any[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewLimit, setPreviewLimit] = useState(25)

  // Export State
  const [exportSelection, setExportSelection] = useState<string[]>([])
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [isExporting, setIsExporting] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const todayDate = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    setLoadingFloats(true)
    fetch(`${apiUrl}/api/floats`)
      .then(res => res.json())
      .then(data => {
        const floatList = data.floats || []
        if (floatList.length > 0) {
          setFloats(floatList)
          setFloatA(floatList[0].wmo)
          setFloatB(floatList[1]?.wmo || floatList[0].wmo)
        } else {
          setFloats([])
          setFloatA("")
          setFloatB("")
        }
      })
      .catch(err => {
        console.error("Error fetching floats:", err)
        setFloats([])
        setFloatA("")
        setFloatB("")
      })
      .finally(() => {
        setLoadingFloats(false)
      })
  }, [])

  // Auto load preview data
  useEffect(() => {
    fetchPreviewData()
  }, [previewLimit])

  const fetchPreviewData = async () => {
    setLoadingPreview(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    try {
      const payload: any = { limit: previewLimit }
      if (exportSelection.length > 0) {
        payload.wmo_ids = exportSelection
      }
      const res = await fetch(`${apiUrl}/api/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      setPreviewData(json.data || [])
    } catch (e) {
      console.error("Failed to fetch data preview", e)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleCompare = async () => {
    if (!floatA || !floatB) return
    setIsComparing(true)
    setCompareError(null)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    try {
      const [resA, resB] = await Promise.all([
        fetch(`${apiUrl}/api/floats/${floatA}/stats`).then(r => r.json()).catch(() => null),
        fetch(`${apiUrl}/api/floats/${floatB}/stats`).then(r => r.json()).catch(() => null)
      ])
      
      if (!resA || resA.error || !resB || resB.error) {
        setCompareError("Unable to retrieve complete telemetry statistics for the selected floats.")
      }

      setStatsA(resA && !resA.error ? resA : null)
      setStatsB(resB && !resB.error ? resB : null)
    } catch (err) {
      console.error("Comparison error:", err)
      setCompareError("Telemetry comparison service is temporarily unreachable.")
      setStatsA(null)
      setStatsB(null)
    } finally {
      setIsComparing(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const payload: any = { wmo_ids: exportSelection }
      if (startDate && endDate) {
        payload.filters = { date_range: [startDate, endDate] }
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const response = await fetch(`${apiUrl}/api/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        let errMessage = "Unable to export ocean profile records at this time."
        try {
          const errJson = await response.json()
          if (errJson?.error) errMessage = errJson.error
        } catch {}
        throw new Error(errMessage)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `oceaniq_argo_export_${new Date().getTime()}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error("Export error:", err)
      alert(err.message || "Unable to complete data export. Please verify your selected floats or date range, or try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const toggleExportSelection = (wmo: string) => {
    setExportSelection(prev => 
      prev.includes(wmo) ? prev.filter(id => id !== wmo) : [...prev, wmo]
    )
  }

  const selectAllFloats = () => {
    setExportSelection(floats.map(f => f.wmo))
  }

  const clearSelection = () => {
    setExportSelection([])
  }

  const formatVal = (val: any) => {
    if (val === null || val === undefined || val === 'error') return "N/A"
    if (typeof val === 'object') {
      if (val.error) return "N/A"
      if (val.avg_mld_depth_db !== undefined) return `${val.avg_mld_depth_db.toFixed(2)} dbar`
      if (val.avg_thermocline_depth_db !== undefined) return `${val.avg_thermocline_depth_db.toFixed(2)} dbar`
      return "N/A"
    }
    return typeof val === 'number' ? val.toFixed(2) : val
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Database className="w-7 h-7 text-ocean-cyan" />
              Dataset Explorer & Export Matrix
            </h1>
            <Badge variant="cyan">Telemetry Lab</Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Compare analytical thermodynamic parameters between autonomous ARGO floats and export high-density CTD records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/chat">
            <Button variant="cyan" size="sm" className="text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Ask Aqua AI
            </Button>
          </Link>
        </div>
      </div>

      {/* SECTION 1: FLOAT COMPARISON MATRIX */}
      <Card variant="elevated" className="card-hover-lift">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-ocean-blue/20 border border-ocean-blue/30 flex items-center justify-center text-ocean-cyan">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Thermodynamic Comparison Matrix</CardTitle>
                <CardDescription>
                  Side-by-side analysis of ocean temperature, salinity, Mixed Layer Depth, and thermocline gradients
                </CardDescription>
              </div>
            </div>

            {(statsA || statsB) && (
              <Link href={`/chat?query=${encodeURIComponent(`Compare thermodynamic parameters, Mixed Layer Depth, and salinity between float ${floatA} and float ${floatB}`)}`}>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <Sparkles className="w-3.5 h-3.5 text-ocean-cyan" />
                  <span>Synthesize in Aqua AI</span>
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          
          {/* Comparison Controls */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-end">
            
            <div className="md:col-span-5 space-y-2">
              <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-ocean-cyan" /> Float Alpha
              </label>
              <select
                value={floatA}
                onChange={(e) => setFloatA(e.target.value)}
                disabled={floats.length === 0 || loadingFloats}
                className="w-full h-11 bg-surface-card border border-border rounded-xl px-4 text-sm font-mono text-foreground focus:outline-none focus:border-ocean-cyan/60 focus:ring-1 focus:ring-ocean-cyan/20 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{loadingFloats ? "-- Loading Active Floats... --" : floats.length === 0 ? "-- No Floats Available --" : "-- Select Primary Float --"}</option>
                {floats.map(f => (
                  <option key={`A-${f.wmo}`} value={f.wmo}>
                    WMO {f.wmo} • {f.region} ({f.measurements_count || 0} pts)
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1 flex items-center justify-center pb-1">
              <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-slate-400">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
            </div>

            <div className="md:col-span-5 space-y-2">
              <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Float Beta
              </label>
              <select
                value={floatB}
                onChange={(e) => setFloatB(e.target.value)}
                disabled={floats.length === 0 || loadingFloats}
                className="w-full h-11 bg-surface-card border border-border rounded-xl px-4 text-sm font-mono text-foreground focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{loadingFloats ? "-- Loading Active Floats... --" : floats.length === 0 ? "-- No Floats Available --" : "-- Select Secondary Float --"}</option>
                {floats.map(f => (
                  <option key={`B-${f.wmo}`} value={f.wmo}>
                    WMO {f.wmo} • {f.region} ({f.measurements_count || 0} pts)
                  </option>
                ))}
              </select>
            </div>

          </div>

          {compareError && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>{compareError}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleCompare}
              disabled={!floatA || !floatB || isComparing}
              isLoading={isComparing}
              variant="cyan"
              className="px-6 font-semibold shadow-md hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              <Activity className="w-4 h-4 mr-2" />
              Run Comparative Analysis
            </Button>
          </div>

          {/* Comparison Results Grid */}
          {(statsA || statsB) ? (
            <div className="rounded-2xl border border-border/80 bg-surface-card overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left font-mono">
                <thead className="text-xs uppercase bg-surface-elevated/80 border-b border-border text-slate-900 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="px-6 py-3.5 font-bold tracking-wider font-sans">Physical Parameter</th>
                    <th className="px-6 py-3.5 font-bold text-ocean-cyan tracking-wider border-l border-border/80">
                      WMO {statsA?.wmo || floatA}
                    </th>
                    <th className="px-6 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 tracking-wider border-l border-border/80">
                      WMO {statsB?.wmo || floatB}
                    </th>
                    <th className="px-6 py-3.5 font-bold text-purple-600 dark:text-purple-400 tracking-wider border-l border-border/80 hidden sm:table-cell font-sans">
                      Variation (Δ)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-slate-900 dark:text-slate-300 font-medium">
                  <tr className="hover:bg-surface-hover/50 transition-colors">
                    <td className="px-6 py-3.5 font-sans font-semibold flex items-center gap-2 text-foreground">
                      <Activity className="w-4 h-4 text-slate-500" />
                      <span>Total Soundings Count</span>
                    </td>
                    <td className="px-6 py-3.5 border-l border-border/40 text-foreground font-bold">
                      {statsA?.measurements_count || 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 border-l border-border/40 text-foreground font-bold">
                      {statsB?.measurements_count || 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 border-l border-border/40 text-slate-700 dark:text-slate-400 hidden sm:table-cell font-medium">
                      {statsA?.measurements_count && statsB?.measurements_count 
                        ? `${Math.abs(statsA.measurements_count - statsB.measurements_count)} records`
                        : "—"}
                    </td>
                  </tr>

                  <tr className="hover:bg-surface-hover/50 transition-colors">
                    <td className="px-6 py-3.5 font-sans font-semibold flex items-center gap-2 text-foreground">
                      <Thermometer className="w-4 h-4 text-rose-500" />
                      <span>Average Temperature (°C)</span>
                    </td>
                    <td className="px-6 py-3.5 border-l border-border/40 text-rose-600 dark:text-rose-300 font-bold">
                      {formatVal(statsA?.temp_avg)}
                    </td>
                    <td className="px-6 py-3.5 border-l border-border/40 text-rose-600 dark:text-rose-300 font-bold">
                      {formatVal(statsB?.temp_avg)}
                    </td>
                    <td className="px-6 py-3.5 border-l border-border/40 text-slate-700 dark:text-slate-400 hidden sm:table-cell font-medium">
                      {statsA?.temp_avg != null && statsB?.temp_avg != null
                        ? `${(statsA.temp_avg - statsB.temp_avg > 0 ? "+" : "")}${(statsA.temp_avg - statsB.temp_avg).toFixed(2)} °C`
                        : "—"}
                    </td>
                  </tr>

                  <tr className="hover:bg-surface-hover/50 transition-colors">
                    <td className="px-6 py-3.5 font-sans font-semibold flex items-center gap-2 text-foreground">
                      <Waves className="w-4 h-4 text-sky-500" />
                      <span>Average Salinity (PSU)</span>
                    </td>
                    <td className="px-6 py-3.5 border-l border-border/40 text-sky-600 dark:text-sky-300 font-bold">
                      {formatVal(statsA?.sal_avg)}
                    </td>
                    <td className="px-6 py-3.5 border-l border-border/40 text-sky-600 dark:text-sky-300 font-bold">
                      {formatVal(statsB?.sal_avg)}
                    </td>
                    <td className="px-6 py-3.5 border-l border-border/40 text-slate-700 dark:text-slate-400 hidden sm:table-cell font-medium">
                      {statsA?.sal_avg != null && statsB?.sal_avg != null
                        ? `${(statsA.sal_avg - statsB.sal_avg > 0 ? "+" : "")}${(statsA.sal_avg - statsB.sal_avg).toFixed(2)} PSU`
                        : "—"}
                    </td>
                  </tr>

                  <tr className="hover:bg-surface-hover/50 transition-colors">
                    <td className="px-6 py-3.5 font-sans font-semibold flex items-center gap-2 text-foreground">
                      <Layers className="w-4 h-4 text-purple-500" />
                      <span>Mixed Layer Depth (MLD)</span>
                    </td>
                    <td className="px-6 py-3.5 border-l border-border/40 text-purple-600 dark:text-purple-300 font-bold">
                      {formatVal(statsA?.mld)}
                    </td>
                    <td className="px-6 py-3.5 border-l border-border/40 text-purple-600 dark:text-purple-300 font-bold">
                      {formatVal(statsB?.mld)}
                    </td>
                    <td className="px-6 py-3.5 border-l border-border/40 text-slate-700 dark:text-slate-400 hidden sm:table-cell font-medium">
                      ΔT = 0.2°C ref
                    </td>
                  </tr>

                  <tr className="hover:bg-surface-hover/50 transition-colors">
                    <td className="px-6 py-3.5 font-sans font-semibold flex items-center gap-2 text-foreground">
                      <Droplets className="w-4 h-4 text-amber-500" />
                      <span>Thermocline Depth</span>
                    </td>
                    <td className="px-6 py-3.5 border-l border-border/40 text-amber-600 dark:text-amber-300 font-bold">
                      {formatVal(statsA?.thermocline)}
                    </td>
                    <td className="px-6 py-3.5 border-l border-border/40 text-amber-600 dark:text-amber-300 font-bold">
                      {formatVal(statsB?.thermocline)}
                    </td>
                    <td className="px-6 py-3.5 border-l border-border/40 text-slate-700 dark:text-slate-400 hidden sm:table-cell font-medium">
                      Max dT/dz core
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-surface-elevated/40 border border-border text-slate-500 text-xs font-mono">
              {floats.length === 0
                ? "No autonomous floats are currently registered in the database."
                : "Select two floats and click “Run Comparative Analysis” to generate the thermodynamic delta table."}
            </div>
          )}

        </CardContent>
      </Card>

      {/* SECTION 2: LIVE TELEMETRY DATA PREVIEW */}
      <Card variant="elevated" className="card-hover-lift">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-500">
                <TableIcon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Live Telemetry Soundings Preview</CardTitle>
                <CardDescription>
                  Inspect raw pressure, temperature, and salinity records from the Neon PostgreSQL database
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={previewLimit}
                onChange={(e) => setPreviewLimit(Number(e.target.value))}
                className="h-8 px-2.5 rounded-lg bg-surface-card border border-border text-xs font-mono text-foreground focus:outline-none shadow-sm"
              >
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
              </select>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchPreviewData}
                disabled={loadingPreview}
                className="h-8 text-xs gap-1 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${loadingPreview ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {loadingPreview ? (
            <div className="p-12 text-center text-slate-500 font-mono text-xs">
              <div className="w-5 h-5 border-2 border-ocean-cyan border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading telemetry soundings from database...
            </div>
          ) : previewData.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              No preview data found.
            </div>
          ) : (
            <table className="w-full text-xs text-left font-mono">
              <thead className="uppercase bg-surface-elevated/80 border-b border-border text-slate-900 dark:text-slate-300 font-sans font-bold">
                <tr>
                  <th className="px-5 py-3 font-bold">WMO ID</th>
                  <th className="px-5 py-3 font-bold">Date / Timestamp</th>
                  <th className="px-5 py-3 font-bold">Cycle</th>
                  <th className="px-5 py-3 font-bold">Latitude</th>
                  <th className="px-5 py-3 font-bold">Longitude</th>
                  <th className="px-5 py-3 text-ocean-cyan font-bold">Pressure (dbar)</th>
                  <th className="px-5 py-3 text-rose-600 dark:text-rose-500 font-bold">Temp (°C)</th>
                  <th className="px-5 py-3 text-sky-600 dark:text-sky-500 font-bold">Salinity (PSU)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 text-slate-900 dark:text-slate-300 font-medium">
                {previewData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="px-5 py-2.5 font-bold text-foreground">{row.wmo}</td>
                    <td className="px-5 py-2.5 text-slate-700 dark:text-slate-400 font-medium">
                      {row.profile_date ? row.profile_date.replace('T', ' ').slice(0, 19) : '—'}
                    </td>
                    <td className="px-5 py-2.5 text-foreground font-semibold">{row.cycle_number ?? '—'}</td>
                    <td className="px-5 py-2.5 text-slate-700 dark:text-slate-400 font-medium">{row.latitude ? row.latitude.toFixed(3) : '—'}</td>
                    <td className="px-5 py-2.5 text-slate-700 dark:text-slate-400 font-medium">{row.longitude ? row.longitude.toFixed(3) : '—'}</td>
                    <td className="px-5 py-2.5 text-ocean-cyan font-bold">{row.pressure ?? '—'}</td>
                    <td className="px-5 py-2.5 text-rose-600 dark:text-rose-300 font-bold">{row.temperature != null ? row.temperature.toFixed(2) : '—'}</td>
                    <td className="px-5 py-2.5 text-sky-600 dark:text-sky-300 font-bold">{row.salinity != null ? row.salinity.toFixed(2) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* SECTION 3: ADVANCED BULK CSV EXPORT HUB */}
      <Card variant="elevated" className="card-hover-lift">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Production CSV Export Hub</CardTitle>
              <CardDescription>
                Download clean, calibrated oceanographic datasets for offline Python, MATLAB, or ODV modeling
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          
          {/* Float Selection (Multi) */}
          <div className="space-y-2 relative">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Target Profiling Floats
              </label>
              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={selectAllFloats}
                  className="text-ocean-cyan hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-400">|</span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-slate-500 hover:text-foreground cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div 
              className="w-full bg-surface-card border border-border rounded-xl px-4 py-3 text-sm text-foreground cursor-pointer flex justify-between items-center hover:border-slate-500 transition-colors shadow-sm"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className={exportSelection.length ? "text-foreground font-mono font-medium" : "text-slate-500 font-mono"}>
                {exportSelection.length 
                  ? `${exportSelection.length} floats selected (${exportSelection.join(", ")})` 
                  : "All Available Floats (Global Export)"}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-elevated border border-border rounded-xl shadow-2xl max-h-64 overflow-y-auto z-30 p-2 space-y-1">
                {floats.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 font-mono">
                    No autonomous floats registered in database
                  </div>
                ) : (
                  floats.map(f => (
                    <div 
                      key={`export-${f.wmo}`}
                      onClick={() => toggleExportSelection(f.wmo)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${exportSelection.includes(f.wmo) ? 'bg-ocean-cyan border-ocean-cyan' : 'border-slate-400 dark:border-slate-700 bg-surface-card'}`}>
                        {exportSelection.includes(f.wmo) && <Check className="w-3 h-3 text-slate-950 font-bold" />}
                      </div>
                      <span className="text-xs font-mono text-foreground">
                        WMO {f.wmo} <span className="text-slate-500 ml-2 font-sans">({f.region})</span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-400 uppercase tracking-wider">
                Start Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input 
                  type="date"
                  value={startDate}
                  max={todayDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-11 bg-surface-card border border-border rounded-xl pl-10 pr-4 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/50 cursor-pointer shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-400 uppercase tracking-wider">
                End Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input 
                  type="date"
                  value={endDate}
                  max={todayDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-11 bg-surface-card border border-border rounded-xl pl-10 pr-4 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/50 cursor-pointer shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Export Action Bar */}
          <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-700 dark:text-slate-400 font-mono font-medium">
              Output includes WMO, date, cycle, coordinates, temperature, pressure, salinity.
            </p>

            <Button
              onClick={handleExport}
              disabled={isExporting}
              isLoading={isExporting}
              className="w-full sm:w-auto px-8 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.98] transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              Generate CSV Bundle
            </Button>
          </div>

        </CardContent>
      </Card>

    </div>
  )
}
