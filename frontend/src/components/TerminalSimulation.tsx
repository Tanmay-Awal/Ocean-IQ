"use client"

import React, { useState, useEffect } from "react"
import { Sparkles, CheckCircle2, Activity } from "lucide-react"

interface QueryScenario {
  title: string
  sql: string
  records: string
  action: string
  resultTitle: string
  resultSubtitle: string
  resultSecondary: string
  completedTime: string
}

const SCENARIOS: QueryScenario[] = [
  {
    title: "Mixed Layer Depth for WMO 2902217",
    sql: "SELECT pres, temp, psal FROM argo_profiles WHERE wmo='2902217'",
    records: "Found 169 vertical measurement records",
    action: "AnalysisService.compute_mld(df, threshold=0.2)",
    resultTitle: "✓ MLD Computed: 42.10 dbar (~42.1 meters)",
    resultSubtitle: "Surface Ref Temp: 28.20 °C | Salinity: 34.82 PSU",
    resultSecondary: "✓ Thermocline Core: 85.50 dbar (Peak dT/dz: 0.38 °C/dbar)",
    completedTime: "Plotly vector profile rendered in 18ms"
  },
  {
    title: "Thermocline gradient for Arabian Sea WMO 1902677",
    sql: "SELECT pres, temp FROM argo_profiles WHERE wmo='1902677' ORDER BY cycle DESC",
    records: "Found 142 vertical soundings from 0 to 2000 dbar",
    action: "AnalysisService.detect_thermocline(df)",
    resultTitle: "✓ Thermocline Depth: 62.40 dbar",
    resultSubtitle: "Core Stability: Pycnocline barrier detected",
    resultSecondary: "✓ Peak Gradient: 0.44 °C/dbar at 58m",
    completedTime: "Geospatial trajectory synced to 3D Earth in 14ms"
  },
  {
    title: "Water mass salinity classification for WMO 2902210",
    sql: "SELECT temp, psal, pres FROM argo_profiles WHERE wmo='2902210'",
    records: "Found 156 vertical CTD measurement records",
    action: "AnalysisService.classify_water_mass(df)",
    resultTitle: "✓ Water Mass: Bay of Bengal Low-Salinity Surface Cap",
    resultSubtitle: "Halocline Gradient: ΔS = 3.2 PSU in upper 50m",
    resultSecondary: "✓ Subsurface Intrusion: High-salinity core at 120 dbar",
    completedTime: "Vector embedding cached in ChromaDB in 12ms"
  },
  {
    title: "Isopycnal potential density anomaly for WMO 2900230",
    sql: "SELECT pres, temp, psal FROM argo_profiles WHERE wmo='2900230'",
    records: "Found 180 vertical hydrographic records",
    action: "AnalysisService.compute_sigma_theta(df)",
    resultTitle: "✓ Potential Density: σ_θ = 24.15 kg/m³ at surface",
    resultSubtitle: "Equatorial Undercurrent: Pycnocline at 95 dbar",
    resultSecondary: "✓ Stratification: N² buoyancy frequency peak at 80m",
    completedTime: "TEOS-10 Thermodynamic EOS calculated in 16ms"
  },
  {
    title: "Geostrophic shear & heat content for WMO 2900765",
    sql: "SELECT pres, temp, psal FROM argo_profiles WHERE wmo='2900765'",
    records: "Found 164 vertical CTD soundings binned to 50m",
    action: "AnalysisService.compute_ocean_heat_content(df, depth=700)",
    resultTitle: "✓ Ocean Heat Content (OHC-700): 4.82 GJ/m²",
    resultSubtitle: "Sub-basin: Southern Indian Ocean Subtropical Gyre",
    resultSecondary: "✓ Thermal anomaly: +0.65 °C above climatological mean",
    completedTime: "Dynamic telemetry synced in 15ms"
  }
]

export function TerminalSimulation() {
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [step, setStep] = useState(0)
  const [typedQuery, setTypedQuery] = useState("")

  const scenario = SCENARIOS[scenarioIndex]

  // Typewriter effect for the query title - snappy, energetic rhythm
  useEffect(() => {
    setTypedQuery("")
    setStep(0)
    let charIdx = 0
    const fullText = scenario.title

    const typeInterval = setInterval(() => {
      if (charIdx < fullText.length) {
        setTypedQuery(fullText.slice(0, charIdx + 1))
        charIdx++
      } else {
        clearInterval(typeInterval)
        // Snappy advance to SQL display
        setTimeout(() => setStep(1), 220)
      }
    }, 18)

    return () => clearInterval(typeInterval)
  }, [scenarioIndex])

  // Continuous step advancement with zero dead pauses
  useEffect(() => {
    if (step === 1) {
      const t = setTimeout(() => setStep(2), 320)
      return () => clearTimeout(t)
    }
    if (step === 2) {
      const t = setTimeout(() => setStep(3), 320)
      return () => clearTimeout(t)
    }
    if (step === 3) {
      const t = setTimeout(() => setStep(4), 360)
      return () => clearTimeout(t)
    }
    if (step === 4) {
      const t = setTimeout(() => setStep(5), 380)
      return () => clearTimeout(t)
    }
    if (step === 5) {
      // Brief 1.1s window to read completion, then immediately flows into the next query
      const t = setTimeout(() => {
        setScenarioIndex((prev) => (prev + 1) % SCENARIOS.length)
      }, 1100)
      return () => clearTimeout(t)
    }
  }, [step])

  return (
    <div className="rounded-2xl border border-slate-300 dark:border-border/80 bg-surface-card p-5 md:p-6 shadow-2xl font-mono text-xs card-hover-lift min-h-[360px] flex flex-col justify-between transition-colors duration-300">
      
      {/* Terminal Title Bar */}
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-border/60 mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold pl-2 hidden sm:inline">
              argo_analysis_core.py
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span>RUNNING</span>
            </span>
            <span className="text-[10px] text-slate-500 font-semibold hidden sm:inline">
              Cycle #{scenarioIndex + 1}
            </span>
          </div>
        </div>

        {/* Live Code Output Body */}
        <div className="space-y-2.5 text-slate-800 dark:text-slate-300 leading-relaxed">
          
          {/* Query Line */}
          <div className="flex items-baseline gap-1 text-slate-600 dark:text-slate-400 font-medium">
            <span># Query parsed: &ldquo;{typedQuery}&rdquo;</span>
            {step === 0 && (
              <span className="inline-block w-1.5 h-3.5 bg-ocean-cyan animate-pulse" />
            )}
          </div>

          {/* SQL Query */}
          {step >= 1 && (
            <div className="animate-fade-in-up">
              <span className="text-ocean-cyan font-bold">&gt;&gt;&gt;</span>{" "}
              <span className="text-purple-600 dark:text-purple-400 font-semibold">SELECT</span>{" "}
              <span className="text-slate-950 dark:text-foreground font-bold">pres, temp, psal</span>{" "}
              <span className="text-purple-600 dark:text-purple-400 font-semibold">FROM</span>{" "}
              <span>argo_profiles</span>{" "}
              <span className="text-purple-600 dark:text-purple-400 font-semibold">WHERE</span>{" "}
              <span className="text-amber-600 dark:text-amber-300 font-semibold">
                {scenario.sql.split("WHERE ")[1] || "active=1"}
              </span>
            </div>
          )}

          {/* Records count */}
          {step >= 2 && (
            <div className="text-slate-600 dark:text-slate-400 pl-4 font-medium animate-fade-in-up">
              {scenario.records}
            </div>
          )}

          {/* AnalysisService computation */}
          {step >= 3 && (
            <div className="animate-fade-in-up">
              <span className="text-ocean-cyan font-bold">&gt;&gt;&gt;</span>{" "}
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">AnalysisService</span>
              .{scenario.action.split(".")[1]}
            </div>
          )}

          {/* Result Card Output */}
          {step >= 4 && (
            <div className="p-3.5 rounded-xl bg-surface-elevated border border-border/80 text-foreground space-y-1 animate-fade-in-up shadow-sm">
              <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{scenario.resultTitle.replace("✓ ", "")}</span>
              </p>
              <p className="text-slate-800 dark:text-slate-300 font-medium pl-5 text-[11px]">
                {scenario.resultSubtitle}
              </p>
              <p className="text-rose-600 dark:text-rose-400 font-bold pl-5 text-[11px]">
                {scenario.resultSecondary}
              </p>
            </div>
          )}

          {/* Plotly rendered line & continuous cycle dispatcher */}
          {step >= 5 && (
            <div className="text-ocean-cyan pt-1 font-bold animate-fade-in-up flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span>&gt;&gt;&gt;</span>
                <span>{scenario.completedTime}</span>
                <Activity className="w-3 h-3 text-ocean-cyan animate-pulse inline-block ml-1" />
              </div>
              <span className="text-[10px] text-slate-500 font-normal animate-pulse hidden sm:inline">
                cycling next query...
              </span>
            </div>
          )}

        </div>
      </div>

      {/* Terminal Footer Status */}
      <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>PostgreSQL Neon &bull; ChromaDB Vector</span>
        <span className="text-ocean-cyan font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Live Pipeline
        </span>
      </div>

    </div>
  )
}
