"use client"

import { useState, useEffect } from "react"
import { ArrowRightLeft, Download, Database, Map, Search, Calendar, ChevronDown, Check, Activity, Droplets, Waves, AlignEndHorizontal } from "lucide-react"

type FloatMetadata = {
  wmo: string;
  region: string;
  active: string;
}

type FloatStats = {
  wmo: string;
  temp_min: number;
  temp_max: number;
  temp_avg: number;
  sal_min: number;
  sal_max: number;
  sal_avg: number;
  mld: number | string | null;
  thermocline: number | string | null;
  measurements_count: number;
}

export default function ExplorePage() {
  const [floats, setFloats] = useState<FloatMetadata[]>([])
  const [loadingFloats, setLoadingFloats] = useState(true)

  // Comparison State
  const [floatA, setFloatA] = useState<string>("")
  const [floatB, setFloatB] = useState<string>("")
  const [statsA, setStatsA] = useState<FloatStats | null>(null)
  const [statsB, setStatsB] = useState<FloatStats | null>(null)
  const [isComparing, setIsComparing] = useState(false)

  // Export State
  const [exportSelection, setExportSelection] = useState<string[]>([])
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [isExporting, setIsExporting] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const todayDate = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetch("http://localhost:5000/api/floats")
      .then(res => res.json())
      .then(data => {
        setFloats(data.floats || [])
        setLoadingFloats(false)
      })
      .catch(err => {
        console.error("Error fetching floats:", err)
        setLoadingFloats(false)
      })
  }, [])

  const handleCompare = async () => {
    if (!floatA || !floatB) return
    setIsComparing(true)
    try {
      const [resA, resB] = await Promise.all([
        fetch(`http://localhost:5000/api/floats/${floatA}/stats`).then(r => r.json()),
        fetch(`http://localhost:5000/api/floats/${floatB}/stats`).then(r => r.json())
      ])
      
      setStatsA(resA.error ? null : resA)
      setStatsB(resB.error ? null : resB)
    } catch (err) {
      console.error("Comparison error:", err)
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
      
      const response = await fetch("http://localhost:5000/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) throw new Error("Export failed")
        
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `argo_data_export_${new Date().getTime()}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export error:", err)
      alert("Failed to export data. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const toggleExportSelection = (wmo: string) => {
    setExportSelection(prev => 
      prev.includes(wmo) ? prev.filter(id => id !== wmo) : [...prev, wmo]
    )
  }

  const formatVal = (val: any) => {
    if (val === null || val === undefined || val === 'error') return "N/A"
    
    // Handle MLD and Thermocline dictionary objects
    if (typeof val === 'object') {
      if (val.error) return "N/A"
      if (val.avg_mld_depth_db !== undefined) return val.avg_mld_depth_db.toFixed(2)
      if (val.avg_thermocline_depth_db !== undefined) return val.avg_thermocline_depth_db.toFixed(2)
      return "N/A"
    }
    
    return typeof val === 'number' ? val.toFixed(2) : val
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0f16] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-10 animate-fade-in-up">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-ocean-cyan flex items-center gap-3">
            <Database className="w-8 h-8 text-ocean-cyan" />
            Explore & Export Data
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Compare analytical metrics between distinct ARGO floats, or bulk export raw profiling data to CSV for offline analysis.
          </p>
        </div>

        {/* SECTION 1: COMPARE FLOATS */}
        <div className="bg-[#111822] border border-[#1e2b38] rounded-2xl p-8 shadow-xl relative overflow-hidden group hover:border-[#2d3d50] transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-ocean-cyan/5 rounded-full blur-3xl -mr-20 -mt-20 transition-all group-hover:bg-ocean-cyan/10 pointer-events-none"></div>
          
          <div className="flex items-center space-x-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-ocean-blue/20 border border-ocean-blue/30 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-ocean-cyan" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Float Comparison Matrix</h2>
              <p className="text-xs text-slate-400">Select two floats to analyze statistical differences</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end relative z-10">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Float A</label>
              <select 
                className="w-full bg-[#0a0f16] border border-[#1e2b38] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ocean-cyan/50 text-slate-200 cursor-pointer"
                value={floatA}
                onChange={(e) => setFloatA(e.target.value)}
              >
                <option value="">-- Select First Float --</option>
                {floats.map(f => (
                  <option key={`A-${f.wmo}`} value={f.wmo}>{f.wmo} ({f.region})</option>
                ))}
              </select>
            </div>
            
            <div className="w-12 h-12 hidden md:flex items-center justify-center shrink-0 mb-1">
              <div className="bg-[#1e2b38] p-2 rounded-full shadow-inner">
                <ArrowRightLeft className="w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Float B</label>
              <select 
                className="w-full bg-[#0a0f16] border border-[#1e2b38] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ocean-cyan/50 text-slate-200 cursor-pointer"
                value={floatB}
                onChange={(e) => setFloatB(e.target.value)}
              >
                <option value="">-- Select Second Float --</option>
                {floats.map(f => (
                  <option key={`B-${f.wmo}`} value={f.wmo}>{f.wmo} ({f.region})</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleCompare}
              disabled={!floatA || !floatB || isComparing}
              className="w-full md:w-auto h-12 px-8 bg-gradient-to-r from-ocean-cyan to-ocean-blue rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isComparing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <AlignEndHorizontal className="w-4 h-4" />
              )}
              <span>Compare</span>
            </button>
          </div>

          {/* Comparison Results */}
          {(statsA || statsB) && (
            <div className="mt-8 overflow-hidden rounded-xl border border-[#1e2b38] bg-[#0a0f16]">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-[#111822] border-b border-[#1e2b38]">
                  <tr>
                    <th className="px-6 py-4 text-slate-400 font-semibold tracking-wider w-1/3">Metric</th>
                    <th className="px-6 py-4 font-bold text-ocean-cyan tracking-wider w-1/3 border-l border-[#1e2b38]">WMO {statsA?.wmo || floatA}</th>
                    <th className="px-6 py-4 font-bold text-emerald-400 tracking-wider w-1/3 border-l border-[#1e2b38]">WMO {statsB?.wmo || floatB}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2b38]">
                  <tr className="hover:bg-[#111822] transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center space-x-2"><Activity className="w-4 h-4 text-slate-500" /> <span>Total Profiles</span></td>
                    <td className="px-6 py-4 border-l border-[#1e2b38] font-mono text-slate-300">{statsA?.measurements_count || 'N/A'}</td>
                    <td className="px-6 py-4 border-l border-[#1e2b38] font-mono text-slate-300">{statsB?.measurements_count || 'N/A'}</td>
                  </tr>
                  <tr className="hover:bg-[#111822] transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center space-x-2"><Droplets className="w-4 h-4 text-orange-400" /> <span>Avg Temperature (°C)</span></td>
                    <td className="px-6 py-4 border-l border-[#1e2b38] font-mono text-slate-300">{formatVal(statsA?.temp_avg)}</td>
                    <td className="px-6 py-4 border-l border-[#1e2b38] font-mono text-slate-300">{formatVal(statsB?.temp_avg)}</td>
                  </tr>
                  <tr className="hover:bg-[#111822] transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center space-x-2"><Waves className="w-4 h-4 text-blue-400" /> <span>Avg Salinity (PSU)</span></td>
                    <td className="px-6 py-4 border-l border-[#1e2b38] font-mono text-slate-300">{formatVal(statsA?.sal_avg)}</td>
                    <td className="px-6 py-4 border-l border-[#1e2b38] font-mono text-slate-300">{formatVal(statsB?.sal_avg)}</td>
                  </tr>
                  <tr className="hover:bg-[#111822] transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center space-x-2"><Map className="w-4 h-4 text-emerald-400" /> <span>Mixed Layer Depth (m)</span></td>
                    <td className="px-6 py-4 border-l border-[#1e2b38] font-mono text-slate-300">{formatVal(statsA?.mld)}</td>
                    <td className="px-6 py-4 border-l border-[#1e2b38] font-mono text-slate-300">{formatVal(statsB?.mld)}</td>
                  </tr>
                  <tr className="hover:bg-[#111822] transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center space-x-2"><AlignEndHorizontal className="w-4 h-4 text-purple-400" /> <span>Thermocline Depth (m)</span></td>
                    <td className="px-6 py-4 border-l border-[#1e2b38] font-mono text-slate-300">{formatVal(statsA?.thermocline)}</td>
                    <td className="px-6 py-4 border-l border-[#1e2b38] font-mono text-slate-300">{formatVal(statsB?.thermocline)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>


        {/* SECTION 2: EXPORT DATA */}
        <div className="bg-[#111822] border border-[#1e2b38] rounded-2xl p-8 shadow-xl relative overflow-hidden group hover:border-[#2d3d50] transition-all" style={{ animationDelay: '100ms' }}>
          
          <div className="flex items-center space-x-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Download className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Bulk CSV Export</h2>
              <p className="text-xs text-slate-400">Download raw telemetry and physical parameters for offline modeling</p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Float Selection (Multi) */}
            <div className="space-y-2 relative">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Floats (Optional: Leave empty for all)</label>
              
              <div 
                className="w-full bg-[#0a0f16] border border-[#1e2b38] rounded-xl px-4 py-3 text-sm focus:outline-none text-slate-200 cursor-pointer flex justify-between items-center"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span className={exportSelection.length ? "text-white" : "text-slate-500"}>
                  {exportSelection.length ? `${exportSelection.length} floats selected` : "All Floats (Global Export)"}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </div>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0f16] border border-[#1e2b38] rounded-xl shadow-2xl max-h-64 overflow-y-auto z-20 p-2">
                  {floats.map(f => (
                    <div 
                      key={`export-${f.wmo}`}
                      onClick={() => toggleExportSelection(f.wmo)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-[#111822] cursor-pointer transition-colors"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${exportSelection.includes(f.wmo) ? 'bg-ocean-cyan border-ocean-cyan' : 'border-[#2d3d50] bg-transparent'}`}>
                        {exportSelection.includes(f.wmo) && <Check className="w-3 h-3 text-[#0a0f16] font-bold" />}
                      </div>
                      <span className="text-sm text-slate-300">WMO {f.wmo} <span className="text-[10px] text-slate-500 ml-2">({f.region})</span></span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-slate-500" />
                  </div>
                  <input 
                    type="date"
                    value={startDate}
                    max={todayDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#0a0f16] border border-[#1e2b38] rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 text-slate-200 cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
              
              <div className="flex-1 space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-slate-500" />
                  </div>
                  <input 
                    type="date"
                    value={endDate}
                    max={todayDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#0a0f16] border border-[#1e2b38] rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 text-slate-200 cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1e2b38]">
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="h-12 px-8 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer w-full md:w-auto ml-auto"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Generate CSV Bundle</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
