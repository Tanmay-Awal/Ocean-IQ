"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ArrowRightLeft, 
  Download, 
  Database, 
  Calendar, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
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
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPreviewFloat, setSelectedPreviewFloat] = useState<string>("all")

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

  // Auto load preview data on mount or when selected float changes
  useEffect(() => {
    setCurrentPage(1)
    fetchPreviewData()
  }, [selectedPreviewFloat])

  const totalPages = Math.max(1, Math.ceil(previewData.length / pageSize))
  const displayedRows = previewData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const startIndex = previewData.length ? (currentPage - 1) * pageSize + 1 : 0
  const endIndex = Math.min(currentPage * pageSize, previewData.length)

  const getPageNumbers = () => {
    const pages: number[] = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - 2)
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  const fetchPreviewData = async () => {
    setLoadingPreview(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    try {
      const payload: any = { limit: 120 }
      if (selectedPreviewFloat && selectedPreviewFloat !== "all") {
        payload.wmo_ids = [selectedPreviewFloat]
      }
      const res = await fetch(`${apiUrl}/api/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      setPreviewData(json.data || [])
      setCurrentPage(1)
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
      
      {/* Page Header in Modern Landing Page Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-white/10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0284c7] dark:text-cyan-400 tracking-[0.2em] uppercase">
            <span>DATASET EXPLORER & COMPARATIVE MATRIX</span>
            <span className="w-6 h-[1.5px] bg-[#0284c7]/60 dark:bg-cyan-400/60" />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#0c2340] dark:text-white flex items-center gap-2.5">
              <Database className="w-7 h-7 text-[#0284c7]" />
              Dataset Explorer & Export Matrix
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-100 dark:bg-sky-950/80 text-[#0284c7] dark:text-cyan-300 border border-sky-200 dark:border-sky-800/50 shadow-xs">
              Telemetry Lab
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-normal max-w-2xl">
            Compare analytical thermodynamic parameters between autonomous ARGO floats and export high-density CTD records.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/chat">
            <button className="h-10 px-5 rounded-full bg-[#0c2340] hover:bg-[#07172b] dark:bg-white dark:text-[#0c2340] dark:hover:bg-slate-100 text-white text-xs sm:text-sm font-medium flex items-center gap-2 shadow-md shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 dark:text-[#0284c7]" />
              <span>Ask Aqua AI</span>
            </button>
          </Link>
        </div>
      </div>

      {/* SECTION 1: FLOAT COMPARISON MATRIX */}
      <div className="rounded-3xl bg-white/70 dark:bg-[#0a1222]/80 backdrop-blur-xl border border-white/90 dark:border-white/10 p-6 shadow-[0_10px_30px_rgba(2,132,199,0.06)] space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100/80 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800/50 flex items-center justify-center text-[#0284c7] dark:text-cyan-300 shadow-xs">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0c2340] dark:text-white tracking-tight">Thermodynamic Comparison Matrix</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Side-by-side analysis of ocean temperature, salinity, Mixed Layer Depth, and thermocline gradients
                </p>
              </div>
            </div>

            {(statsA || statsB) && (
              <Link href={`/chat?query=${encodeURIComponent(`Compare thermodynamic parameters, Mixed Layer Depth, and salinity between float ${floatA} and float ${floatB}`)}`}>
                <button className="h-9 px-4 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-[#0284c7] dark:hover:text-cyan-300 flex items-center gap-1.5 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5 text-[#0284c7] dark:text-cyan-300" />
                  <span>Synthesize in Aqua AI</span>
                </button>
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-6">
          
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
            <div className="p-8 text-center rounded-2xl bg-white/50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-white/10 text-slate-500 text-xs font-mono">
              {floats.length === 0
                ? "No autonomous floats are currently registered in the database."
                : "Select two floats and click “Run Comparative Analysis” to generate the thermodynamic delta table."}
            </div>
          )}

        </div>
      </div>

      {/* SECTION 2: LIVE TELEMETRY DATA PREVIEW */}
      <div className="rounded-3xl bg-white/70 dark:bg-[#0a1222]/80 backdrop-blur-xl border border-white/90 dark:border-white/10 p-6 shadow-[0_10px_30px_rgba(2,132,199,0.06)] space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100/80 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-xs">
                <TableIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0c2340] dark:text-white tracking-tight">Live Telemetry Soundings Preview</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Inspect raw pressure, temperature, and salinity records from the Neon PostgreSQL database
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <span className="hidden sm:inline">Float:</span>
                <select
                  value={selectedPreviewFloat}
                  onChange={(e) => setSelectedPreviewFloat(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-xs font-mono text-foreground focus:outline-none shadow-xs cursor-pointer max-w-[200px]"
                >
                  <option value="all">All Floats (Balanced)</option>
                  {floats.map((f) => (
                    <option key={`preview-float-${f.wmo}`} value={f.wmo}>
                      WMO {f.wmo} ({f.region})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <span className="hidden sm:inline">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="h-9 px-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-xs font-mono text-foreground focus:outline-none shadow-xs cursor-pointer"
                >
                  <option value={10}>10 rows</option>
                  <option value={25}>25 rows</option>
                  <option value={50}>50 rows</option>
                </select>
              </div>
              <button
                onClick={fetchPreviewData}
                disabled={loadingPreview}
                className="h-9 px-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-[#0284c7] flex items-center gap-1.5 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPreview ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2">
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
            <>
              {/* Scrollable Soundings Viewport with Sticky Header */}
              <div className="max-h-[440px] overflow-y-auto overflow-x-auto scrollbar-thin">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="sticky top-0 z-10 uppercase bg-surface-elevated/95 backdrop-blur-md border-b border-border text-slate-900 dark:text-slate-300 font-sans font-bold shadow-xs">
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
                    {displayedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="px-5 py-2.5 font-bold text-foreground">{row.wmo}</td>
                        <td className="px-5 py-2.5 text-slate-700 dark:text-slate-400 font-medium">
                          {row.profile_date ? row.profile_date.replace('T', ' ').slice(0, 19) : '—'}
                        </td>
                        <td className="px-5 py-2.5 text-foreground font-semibold">
                          {row.cycle_number != null ? `#${row.cycle_number}` : '—'}
                        </td>
                        <td className="px-5 py-2.5 text-slate-700 dark:text-slate-400 font-medium">
                          {row.latitude != null ? `${Number(row.latitude).toFixed(3)}°` : '—'}
                        </td>
                        <td className="px-5 py-2.5 text-slate-700 dark:text-slate-400 font-medium">
                          {row.longitude != null ? `${Number(row.longitude).toFixed(3)}°` : '—'}
                        </td>
                        <td className="px-5 py-2.5 text-ocean-cyan font-bold">
                          {row.pressure != null ? (typeof row.pressure === 'number' ? row.pressure.toFixed(2) : Number(row.pressure).toFixed(2)) : '—'}
                        </td>
                        <td className="px-5 py-2.5 text-rose-600 dark:text-rose-300 font-bold">{row.temperature != null ? row.temperature.toFixed(2) : '—'}</td>
                        <td className="px-5 py-2.5 text-sky-600 dark:text-sky-300 font-bold">{row.salinity != null ? row.salinity.toFixed(2) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination & Sounding Counter Navigation Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-border/50 bg-surface-card/70 text-xs font-mono">
                <div className="text-slate-500 font-medium">
                  Showing <span className="text-foreground font-bold">{startIndex}</span> &ndash;{" "}
                  <span className="text-foreground font-bold">{endIndex}</span> of{" "}
                  <span className="text-ocean-cyan font-bold">{previewData.length}</span> soundings
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-7 px-2 text-xs font-semibold"
                    title="First Page"
                  >
                    &laquo;
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-7 px-2.5 text-xs font-semibold"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Prev
                  </Button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-7 min-w-[28px] px-2 rounded-md font-bold text-xs transition-all ${
                          currentPage === page
                            ? "bg-ocean-cyan text-slate-950 shadow-sm"
                            : "bg-surface-elevated text-foreground hover:bg-surface-hover border border-border/60"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-7 px-2.5 text-xs font-semibold"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-7 px-2 text-xs font-semibold"
                    title="Last Page"
                  >
                    &raquo;
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SECTION 3: ADVANCED BULK CSV EXPORT HUB */}
      <div className="rounded-3xl bg-white/70 dark:bg-[#0a1222]/80 backdrop-blur-xl border border-white/90 dark:border-white/10 p-6 shadow-[0_10px_30px_rgba(2,132,199,0.06)] space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0c2340] dark:text-white tracking-tight">Production CSV Export Hub</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Download clean, calibrated oceanographic datasets for offline Python, MATLAB, or ODV modeling
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          
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
                  className="text-[#0284c7] hover:underline cursor-pointer font-semibold"
                >
                  Select All
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
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
              className="w-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-foreground cursor-pointer flex justify-between items-center hover:border-slate-400 transition-colors shadow-xs"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className={exportSelection.length ? "text-foreground font-mono font-semibold text-xs" : "text-slate-500 font-mono text-xs"}>
                {exportSelection.length 
                  ? `${exportSelection.length} floats selected (${exportSelection.join(", ")})` 
                  : "All Available Floats (Global Export)"}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-[#071326]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl max-h-64 overflow-y-auto z-30 p-2 space-y-1">
                {floats.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 font-mono">
                    No autonomous floats registered in database
                  </div>
                ) : (
                  floats.map(f => (
                    <div 
                      key={`export-${f.wmo}`}
                      onClick={() => toggleExportSelection(f.wmo)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer transition-colors"
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${exportSelection.includes(f.wmo) ? 'bg-[#0284c7] border-[#0284c7]' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                        {exportSelection.includes(f.wmo) && <Check className="w-3 h-3 text-white font-bold" />}
                      </div>
                      <span className="text-xs font-mono text-foreground font-medium">
                        WMO {f.wmo} <span className="text-slate-500 ml-2 font-sans font-normal">({f.region})</span>
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
              <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Start Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input 
                  type="date"
                  value={startDate}
                  max={todayDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-11 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-2xl pl-10 pr-4 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/50 cursor-pointer shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                End Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input 
                  type="date"
                  value={endDate}
                  max={todayDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-11 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-2xl pl-10 pr-4 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/50 cursor-pointer shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Export Action Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
              Output includes WMO, date, cycle, coordinates, temperature, pressure, salinity.
            </p>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full sm:w-auto h-11 px-8 rounded-full bg-[#0c2340] hover:bg-[#07172b] dark:bg-white dark:text-[#0c2340] dark:hover:bg-slate-100 text-white font-medium text-xs sm:text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
              <span>{isExporting ? "Generating Bundle..." : "Generate CSV Bundle"}</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  )
}
