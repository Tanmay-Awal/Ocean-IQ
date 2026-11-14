"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

interface HydroScenario {
  query: string
  sql: string
  func: string
  resultTitle: string
  resultSubtitle: string
  cycle: string
}

const SCENARIOS: HydroScenario[] = [
  {
    query: "Water mass salinity classification for WMO 2902210",
    sql: "SELECT pres, temp, psal FROM argo_profiles WHERE wmo='2902210'",
    func: "AnalysisService.classify_water_mass(df)",
    resultTitle: "Water Mass: Bay of Bengal Low-Salinity Surface Cap",
    resultSubtitle: "Halocline Gradient: ΔS = 3.2 PSU in upper 50m",
    cycle: "Cycle #3"
  },
  {
    query: "Mixed Layer Depth (MLD) calculation for WMO 2902217",
    sql: "SELECT pres, temp, psal FROM argo_profiles WHERE wmo='2902217'",
    func: "AnalysisService.compute_mld(df, threshold=0.2)",
    resultTitle: "Mixed Layer Depth: 42.10 dbar (~42.1m)",
    resultSubtitle: "Surface Ref Temp: 28.20°C | Salinity: 34.82 PSU",
    cycle: "Cycle #169"
  },
  {
    query: "Thermocline gradient maxima for Arabian Sea WMO 1902677",
    sql: "SELECT pres, temp FROM argo_profiles WHERE wmo='1902677' ORDER BY cycle DESC",
    func: "AnalysisService.detect_thermocline(df)",
    resultTitle: "Peak Thermocline: 85.50 dbar (dT/dz: 0.38°C/dbar)",
    resultSubtitle: "Core Stability: Pycnocline barrier detected",
    cycle: "Cycle #48"
  }
]

export function HydrodynamicSection() {
  const [index, setIndex] = useState(0)
  const current = SCENARIOS[index]

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SCENARIOS.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  return (
    <section 
      id="telemetry" 
      className="scroll-mt-24 relative isolate min-h-[600px] sm:min-h-[660px] lg:min-h-[720px] xl:min-h-[780px] flex items-center overflow-hidden -mt-28 sm:-mt-32 lg:-mt-36 z-40 pt-32 sm:pt-36 lg:pt-40 pb-28 sm:pb-32 lg:pb-36"
    >
      
      {/* High-Resolution Section 5 Background Image with Seamless Optical Feather */}
      <Image
        src="/section-5-bg.png"
        alt="Automated Physical Oceanography Calculations Engine Background"
        fill
        priority
        unoptimized
        className="object-cover object-center pointer-events-none z-0"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 85px, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 85px, black 100%)'
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Heading & Description */}
          <div className="lg:col-span-5 space-y-6">
            <ScrollReveal direction="right" delay={150} duration={700}>
              <div className="space-y-6">
                {/* Eyebrow Label */}
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0284c7] tracking-[0.2em] uppercase">
                  <span>HYDRODYNAMIC CALCULATIONS ENGINE</span>
                  <span className="w-6 h-[1.5px] bg-[#0284c7]/60" />
                </div>

                {/* Serif Heading */}
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#0c2340] dark:text-white leading-[1.16] tracking-tight">
                  Automated Physical <br />
                  Oceanography at the Edge
                </h2>

                {/* Subtitle */}
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-md">
                  Eliminate tedious MATLAB and NetCDF processing. OceanIQ computes critical physical oceanography metrics instantaneously.
                </p>

                {/* CTA Button */}
                <div className="pt-2">
                  <Link href="/explore">
                    <button className="h-12 px-7 rounded-full bg-[#0c2340] hover:bg-[#07172b] dark:bg-white dark:text-[#0c2340] dark:hover:bg-slate-100 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-black/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                      <span>Explore Calculations</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Code Simulation Window */}
          <div className="lg:col-span-7 relative">
            <ScrollReveal direction="left" delay={250} duration={750}>
              <div className="rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white dark:border-white/10 shadow-[0_20px_50px_rgba(2,132,199,0.09)] p-6 space-y-5 transition-all hover:shadow-[0_25px_60px_rgba(2,132,199,0.18)]">
              
              {/* Window Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                  <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-[#0284c7] font-semibold">
                    RUNNING
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                    {current.cycle}
                  </span>
                </div>
              </div>

              {/* Code Simulation Body */}
              <div 
                key={`code-${index}`}
                className="rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 p-5 font-mono text-xs sm:text-[13px] leading-relaxed border border-slate-200/50 dark:border-slate-800/60 space-y-2 transition-all duration-500 animate-fadeIn"
              >
                <p className="text-slate-500 italic">
                  # Query parsed: &quot;{current.query}&quot;
                </p>
                <p className="text-slate-800 dark:text-slate-200">
                  <span className="text-[#0284c7]">&gt;&gt;&gt;</span>{" "}
                  <span className="text-sky-700 dark:text-sky-400 font-semibold">{current.sql}</span>
                </p>
                <p className="text-slate-800 dark:text-slate-200">
                  <span className="text-[#0284c7]">&gt;&gt;&gt;</span> {current.func}
                </p>
              </div>

              {/* Result Badge */}
              <div 
                key={`result-${index}`}
                className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#ecfdf5] dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 transition-all duration-500 animate-fadeIn"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {current.resultTitle}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                      {current.resultSubtitle}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-xs shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Live Results</span>
                </div>
              </div>

            </div>
            </ScrollReveal>
          </div>

        </div>
      </div>
    </section>
  )
}

