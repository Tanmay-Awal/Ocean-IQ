"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Bot, Layers, Cpu, Sparkles, ShieldCheck, ArrowRight } from "lucide-react"

export function ArchitectureSection() {
  const [activeTab, setActiveTab] = useState<"prompt" | "sql" | "math" | "output">("prompt")

  return (
    <section id="architecture" className="scroll-mt-24 py-20 lg:py-28 relative overflow-hidden bg-gradient-to-b from-[#f0f9ff]/70 via-white to-[#e0f2fe]/50 dark:from-[#030712] dark:via-[#040e24] dark:to-[#030712]">
      
      {/* Background ambient hydro-glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-sky-400/10 via-cyan-400/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 space-y-16">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#bae6fd]/40 dark:bg-sky-950/70 border border-[#7dd3fc]/40 dark:border-sky-800/50 text-xs font-mono font-semibold text-[#0284c7] dark:text-sky-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#0284c7] animate-pulse" />
            <span>HYBRID RAG & GEOSPATIAL VECTOR PIPELINE</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-[#0c2340] dark:text-white leading-[1.16]">
            Dual-Engine Oceanographic Architecture
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            How Aqua translates natural language into vectorized spatial SQL, executes thermodynamic differential equations, and streams interactive Plotly depth profiles in real time.
          </p>
        </div>

        {/* 4 Architectural Pipeline Stages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Stage 1 */}
          <div className="p-6 rounded-2xl bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-white dark:border-white/10 shadow-[0_8px_30px_rgba(2,132,199,0.06)] hover:shadow-[0_16px_40px_rgba(2,132,199,0.12)] hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-mono font-bold text-[#0284c7] px-2.5 py-0.5 rounded-md bg-[#e0f2fe] dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800">
                  STAGE 01
                </span>
                <Bot className="w-5 h-5 text-[#0284c7]" />
              </div>
              <h3 className="text-base font-bold text-[#0c2340] dark:text-white mb-2">
                Intent & Geo-Parsing
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                <code className="text-[11px] font-mono text-[#0284c7] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">IntentService</code> classifies prompt targets. <code className="text-[11px] font-mono text-[#0284c7] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">GeocoderService</code> resolves named coastal zones via OpenStreetMap into coordinate bounding boxes.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500">
              <span className="text-[#0c2340] dark:text-slate-300 font-semibold">Engine:</span> OSM Nominatim • Regex Parser
            </div>
          </div>

          {/* Stage 2 */}
          <div className="p-6 rounded-2xl bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-white dark:border-white/10 shadow-[0_8px_30px_rgba(2,132,199,0.06)] hover:shadow-[0_16px_40px_rgba(2,132,199,0.12)] hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-mono font-bold text-[#0284c7] px-2.5 py-0.5 rounded-md bg-[#e0f2fe] dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800">
                  STAGE 02
                </span>
                <Layers className="w-5 h-5 text-[#0284c7]" />
              </div>
              <h3 className="text-base font-bold text-[#0c2340] dark:text-white mb-2">
                Hybrid Dual Ingestion
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                <code className="text-[11px] font-mono text-[#0284c7] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">ChromaDB</code> executes vector semantic search over float metadata. Simultaneously, SQL streams raw pressure, temperature, salinity, and dissolved oxygen rows from PostgreSQL.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500">
              <span className="text-[#0c2340] dark:text-slate-300 font-semibold">Storage:</span> ChromaDB • Neon Postgres
            </div>
          </div>

          {/* Stage 3 */}
          <div className="p-6 rounded-2xl bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-white dark:border-white/10 shadow-[0_8px_30px_rgba(2,132,199,0.06)] hover:shadow-[0_16px_40px_rgba(2,132,199,0.12)] hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-mono font-bold text-sky-600 px-2.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800">
                  STAGE 03
                </span>
                <Cpu className="w-5 h-5 text-sky-600" />
              </div>
              <h3 className="text-base font-bold text-[#0c2340] dark:text-white mb-2">
                Vectorized Ocean Math
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                <code className="text-[11px] font-mono text-sky-600 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">AnalysisService</code> computes physical oceanography algorithms in memory: MLD via ΔT = 0.2°C surface threshold, thermocline maxima via max(dT/dz), and T-S water mass classification.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500">
              <span className="text-[#0c2340] dark:text-slate-300 font-semibold">Calculations:</span> NumPy • SciPy • Pandas
            </div>
          </div>

          {/* Stage 4 */}
          <div className="p-6 rounded-2xl bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-white dark:border-white/10 shadow-[0_8px_30px_rgba(2,132,199,0.06)] hover:shadow-[0_16px_40px_rgba(2,132,199,0.12)] hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-mono font-bold text-emerald-600 px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                  STAGE 04
                </span>
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-[#0c2340] dark:text-white mb-2">
                Dual Synthesis & SSE
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Packages scientific context for Gemini 2.0 Thinking and Groq Llama 3.3. Streams real-time Markdown tokens while simultaneously delivering interactive Plotly JSON depth profiles with zero blocking latency.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500">
              <span className="text-[#0c2340] dark:text-slate-300 font-semibold">Stream:</span> SSE Stream • Plotly.js
            </div>
          </div>

        </div>

        {/* Live Interactive Query Inspector */}
        <div className="rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white dark:border-white/10 shadow-[0_20px_50px_rgba(2,132,199,0.09)] overflow-hidden">
          
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-xs font-mono font-bold text-[#0c2340] dark:text-white">
                Live Pipeline Inspector: WMO 2902217 Execution
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-mono">
              <button
                onClick={() => setActiveTab("prompt")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                  activeTab === "prompt"
                    ? "bg-white dark:bg-slate-900 text-[#0284c7] shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                1. Input Prompt
              </button>
              <button
                onClick={() => setActiveTab("sql")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                  activeTab === "sql"
                    ? "bg-white dark:bg-slate-900 text-[#0284c7] shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                2. Spatial SQL & Vector
              </button>
              <button
                onClick={() => setActiveTab("math")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                  activeTab === "math"
                    ? "bg-white dark:bg-slate-900 text-[#0284c7] shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                3. Physics Math
              </button>
              <button
                onClick={() => setActiveTab("output")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                  activeTab === "output"
                    ? "bg-white dark:bg-slate-900 text-[#0284c7] shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                4. Synthesis & Plotly
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-slate-950/40">
            {activeTab === "prompt" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span className="font-bold text-[#0284c7] uppercase">Natural Language Query Ingestion</span>
                  <span>UTF-8 Prompt</span>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 font-mono text-sm leading-relaxed text-[#0c2340] dark:text-white">
                  &quot;Calculate Mixed Layer Depth and plot CTD vertical profile for float WMO 2902217 in the Northern Bay of Bengal.&quot;
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 block mb-1">Identified Intent</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">PLOT_PROFILE_WITH_MLD</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 block mb-1">Parsed Entity</span>
                    <span className="text-[#0284c7] font-bold">WMO 2902217 (APEX Float)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 block mb-1">Geocoded Bounds</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">16.5°N - 22.0°N, 87.0°E - 93.5°E</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sql" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span className="font-bold text-[#0284c7] uppercase">Vector Retrieval & SQL Sounding Fetch</span>
                  <span>Latency: ~38ms</span>
                </div>
                <pre className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 font-mono text-xs overflow-x-auto leading-relaxed text-slate-800 dark:text-slate-200">
{`-- 1. ChromaDB Vector Metadata Match (Cosine Distance: 0.12)
-- Matched WMO 2902217: "Northern Bay of Bengal APEX profiling float, 169 cycles"

-- 2. Parameterized Postgres Query Execution (Neon Serverless)
SELECT wmo, profile_date, cycle_number, latitude, longitude,
       temp, pres, psal, doxy_umolkg
FROM argo_profiles
WHERE wmo = '2902217'
  AND pres BETWEEN 0 AND 2000
ORDER BY cycle_number DESC, pres ASC
LIMIT 500;`}
                </pre>
              </div>
            )}

            {activeTab === "math" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span className="font-bold text-[#0284c7] uppercase">Thermodynamic Analysis Engine</span>
                  <span>Vectorized NumPy / SciPy</span>
                </div>
                <pre className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 font-mono text-xs overflow-x-auto leading-relaxed text-slate-800 dark:text-slate-200">
{`# Mixed Layer Depth (MLD) Calculation: |T(z) - T(10m)| >= 0.2°C
ref_temp = profile_df.loc[(profile_df['pres'] - 10).abs().idxmin()]['temp']  # 28.2°C
mld_row  = profile_df[(profile_df['temp'] - ref_temp).abs() >= 0.2].iloc[0]
mld_db   = mld_row['pres']  # MLD: 42.1 dbar (~42.1 meters)

# Thermocline Gradient Maxima
dz = np.diff(profile_df['pres'])
dT = np.diff(profile_df['temp'])
gradient = np.abs(dT / dz)
thermocline_depth = profile_df['pres'].iloc[np.argmax(gradient)]  # 85.5 dbar`}
                </pre>
                <div className="flex flex-wrap gap-2 text-xs font-mono pt-1">
                  <span className="px-2.5 py-1 rounded-md bg-[#e0f2fe] text-[#0284c7] font-semibold">
                    MLD: 42.1 dbar
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 font-semibold">
                    Thermocline: 85.5 dbar
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-sky-50 text-sky-600 font-semibold">
                    Max Gradient: 0.38 °C/dbar
                  </span>
                </div>
              </div>
            )}

            {activeTab === "output" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span className="font-bold text-emerald-600 uppercase">Dual-LLM Reasoning & Plotly Synthesis</span>
                  <span>Gemini 2.0 Thinking • SSE Stream</span>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs font-sans leading-relaxed text-slate-800 dark:text-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-[#0284c7] font-mono font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Aqua Oceanographic Diagnosis</span>
                  </div>
                  <p>
                    Float <strong>2902217</strong> shows a distinct stratified layer in the Northern Bay of Bengal. The surface isothermal layer extends to <strong>42.1 meters</strong> (MLD), where the temperature begins a steep gradient drop. Peak thermocline occurs at <strong>85.5 dbar</strong> with a maximum gradient of <strong>0.38°C/dbar</strong>.
                  </p>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 font-mono text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Payload: Plotly.js CTD Schema Dispatched</span>
                    <span className="text-emerald-600 font-bold">✓ Verification Complete</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Edge Resilience Guarantee */}
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-[#e0f2fe]/60 via-white to-[#e0f2fe]/60 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 border border-[#bae6fd]/80 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-[#0284c7] font-mono text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Resilient Edge Architecture</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif text-[#0c2340] dark:text-white font-normal">
              Zero-Downtime Multi-Tiered Fallback Engine
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Even during external LLM outages, OceanIQ falls back autonomously to deterministic local NumPy thermodynamic solvers and local ONNX vector embeddings. You never lose scientific calculation access.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/chat">
              <button className="h-10 px-5 rounded-full bg-[#0c2340] hover:bg-[#07172b] dark:bg-white dark:text-[#0c2340] text-white text-xs font-medium flex items-center gap-2 shadow-sm cursor-pointer">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Try Aqua RAG</span>
              </button>
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}

