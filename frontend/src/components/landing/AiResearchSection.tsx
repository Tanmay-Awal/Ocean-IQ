"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Play, Sparkles, User } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"

const PROFILE_DATA = [
  { depth: 0, temp: 28.5 },
  { depth: 25, temp: 28.2 },
  { depth: 50, temp: 27.8 },
  { depth: 75, temp: 24.1 },
  { depth: 100, temp: 19.5 },
  { depth: 150, temp: 14.8 },
  { depth: 200, temp: 12.2 },
  { depth: 300, temp: 9.8 },
  { depth: 500, temp: 7.2 },
  { depth: 800, temp: 5.4 },
  { depth: 1000, temp: 4.6 },
]

export function AiResearchSection() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])
  return (
    <section className="relative isolate min-h-[460px] sm:min-h-[500px] md:min-h-[540px] lg:min-h-[580px] xl:min-h-[620px] flex items-center overflow-hidden -mt-28 sm:-mt-32 lg:-mt-36 z-30 pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-20 lg:pb-24">
      
      {/* High-Resolution Section 4 Background Image with Seamless Optical Feather */}
      <Image
        src="/section-4-bg.png"
        alt="AI-Powered Oceanographic Research Background"
        fill
        priority
        unoptimized
        className="object-cover object-center pointer-events-none z-0"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 85px, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 85px, black 100%)'
        }}
      />

      <div className="max-w-[1550px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-16 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          
          {/* Left Column: Shifted to the right away from bottom-left shark */}
          <div className="lg:col-span-5 lg:pl-6 xl:pl-12 space-y-4 max-w-lg">
            <ScrollReveal direction="right" delay={150} duration={700}>
              <div className="space-y-4">
                {/* Eyebrow Label */}
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0284c7] tracking-[0.2em] uppercase">
                  <span>AI-POWERED RESEARCH</span>
                  <span className="w-6 h-[1.5px] bg-[#0284c7]/60" />
                </div>

                {/* Serif Heading */}
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#0c2340] dark:text-white leading-[1.14] tracking-tight">
                  From Questions <br />
                  <span className="italic font-normal">to Discoveries</span>
                </h2>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-normal leading-relaxed max-w-md">
                  Leverage Aqua Research AI for natural-language queries, advanced reasoning, and interactive visualizations.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link href="/chat">
                    <button className="h-11 px-6 rounded-full bg-[#0c2340] hover:bg-[#07172b] dark:bg-white dark:text-[#0c2340] dark:hover:bg-slate-100 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-black/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                      <span>Try Aqua AI</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>

                  <Link href="/chat?demo=true">
                    <button className="h-11 px-6 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300/80 dark:border-slate-700 text-[#0c2340] dark:text-white hover:bg-white font-medium text-sm flex items-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                      <span>Watch Demo</span>
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Shifted further to the right */}
          <div className="lg:col-span-7 flex justify-end">
            <ScrollReveal direction="left" delay={250} duration={750} className="w-full max-w-2xl">
              <div className="w-full rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white dark:border-white/10 shadow-[0_20px_50px_rgba(2,132,199,0.09)] p-4 sm:p-6 space-y-4 hover:shadow-[0_25px_60px_rgba(2,132,199,0.18)] transition-shadow duration-300">
              
              {/* User Prompt Bubble (Right-aligned) */}
              <div className="flex justify-end">
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#e0f2fe] dark:bg-sky-950/70 border border-sky-200/70 dark:border-sky-800/50 text-[#0284c7] dark:text-sky-300 text-xs sm:text-sm font-medium shadow-xs">
                  <div className="w-5 h-5 rounded-full bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                    <User className="w-3 h-3" />
                  </div>
                  <span>Show me the temperature profile in the Indian Ocean</span>
                </div>
              </div>

              {/* Aqua AI Response Header */}
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 pt-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#06b6d4] text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span>Here&apos;s the temperature profile across the Indian Ocean:</span>
              </div>

              {/* Visualization Grid: Graph + Heatmap */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2">
                
                {/* Left Area Chart: Vertical Ocean Temperature Curve */}
                <div className="sm:col-span-8 rounded-2xl bg-white/60 dark:bg-slate-950/50 p-4 border border-slate-200/60 dark:border-slate-800 hover:border-sky-300/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase">Vertical Profile (CTD)</span>
                    <span className="text-[11px] font-mono text-[#0284c7] font-bold">WMO 2902217</span>
                  </div>

                  <div className="h-36 sm:h-40 w-full">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={PROFILE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="oceanCurve" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(2, 132, 199, 0.12)" />
                          <XAxis 
                            dataKey="depth" 
                            tick={{ fontSize: 10, fill: "#64748b" }} 
                            tickFormatter={(val) => `${val}m`}
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fill: "#64748b" }} 
                            domain={[0, 32]}
                            tickFormatter={(val) => `${val}°C`}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="rounded-lg bg-slate-900 text-white text-[11px] font-mono p-2 shadow-lg">
                                    <p>Depth: {payload[0].payload.depth}m</p>
                                    <p className="text-cyan-400 font-bold">Temp: {payload[0].value}°C</p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="temp"
                            stroke="#0284c7"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#oceanCurve)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full bg-slate-100/50 dark:bg-slate-900/50 rounded-xl" />
                    )}
                  </div>
                </div>

                {/* Right SST Heatmap Tile */}
                <div className="sm:col-span-4 rounded-2xl bg-white/60 dark:bg-slate-950/50 p-4 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between hover:border-sky-300/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase">Basin SST</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  <div className="relative w-full h-28 sm:h-32 rounded-xl overflow-hidden shadow-inner border border-sky-200/50 dark:border-sky-800/40">
                    <Image
                      src="/sst-map.png"
                      alt="Sea Surface Temperature Heatmap"
                      fill
                      className="object-cover"
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-2 text-center">
                    Indian Ocean SST Anomaly
                  </p>
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

