"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Play, Thermometer, Globe, BarChart3, Activity } from "lucide-react"
import { CountUp } from "@/components/ui/count-up"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

interface HeroStats {
  totalFloats: number
  cachedProfiles: number
  avgTemperature: number
  dataCoverage: number
}

export function HeroSection({ stats }: { stats: HeroStats }) {
  return (
    <section className="relative isolate min-h-[92vh] lg:min-h-[96vh] flex flex-col justify-between pt-28 pb-20 sm:pb-24 lg:pb-28 overflow-hidden">
      
      {/* Background Image: Research vessel on surface + underwater ocean & fish */}
      <Image
        src="/landing-bg.png"
        alt="OceanIQ Research Vessel and Oceanic Telemetry"
        fill
        priority
        unoptimized
        className="object-cover object-right-top md:object-center pointer-events-none z-0"
      />

      {/* Atmospheric Soft Gradient Overlays for perfect legibility in both light & dark */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/45 to-transparent dark:from-[#030712]/95 dark:via-[#030712]/50 dark:to-transparent pointer-events-none z-[1]" />

      {/* Hero Typography & CTAs */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-8 sm:pt-14 md:pt-18">
        <div className="max-w-2xl space-y-6">
          
          {/* Eyebrow Label */}
          <ScrollReveal direction="down" delay={100} duration={600}>
            <div className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-[#0284c7] tracking-[0.2em] uppercase">
              <span>THE NEXT FRONTIER IN OCEAN INTELLIGENCE</span>
              <span className="w-6 h-[1.5px] bg-[#0284c7]/60" />
            </div>
          </ScrollReveal>

          {/* Headline in Serif Display Typography */}
          <ScrollReveal direction="up" delay={200} duration={700}>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-[#0c2340] dark:text-white leading-[1.12]">
              Understand Our Ocean <br />
              <span className="italic font-normal">Like Never Before</span>
            </h1>
          </ScrollReveal>

          {/* Subtitle */}
          <ScrollReveal direction="up" delay={350} duration={600}>
            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-xl font-normal leading-relaxed">
              Advanced analytics. Real-time telemetry. AI-powered insights for a deeper understanding of our planet.
            </p>
          </ScrollReveal>

          {/* Buttons Row */}
          <ScrollReveal direction="up" delay={450} duration={600}>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/dashboard">
                <button className="h-12 px-7 rounded-full bg-[#0c2340] hover:bg-[#07172b] dark:bg-white dark:text-[#0c2340] dark:hover:bg-slate-100 text-white font-medium text-sm flex items-center gap-2.5 shadow-lg shadow-black/15 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  <span>Explore Platform</span>
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </Link>

              <a href="#capabilities">
                <button className="h-12 px-7 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/80 dark:border-slate-700 text-[#0c2340] dark:text-white hover:bg-white dark:hover:bg-slate-800 font-medium text-sm shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  View Capabilities
                </button>
              </a>
            </div>
          </ScrollReveal>

        </div>
      </div>

      {/* Floating Telemetry Stats Ribbon Over Waterline */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 w-full pt-16 lg:pt-24">
        <ScrollReveal direction="up" delay={550} duration={800}>
          <div className="rounded-2xl sm:rounded-3xl bg-white/55 dark:bg-slate-900/70 backdrop-blur-xl border border-white/70 dark:border-white/10 shadow-[0_16px_40px_rgba(2,132,199,0.08)] p-5 sm:p-7 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/60 dark:divide-slate-800/60 hover:shadow-[0_20px_50px_rgba(2,132,199,0.14)] transition-shadow duration-300">
          
          {/* Stat 1: Active Floats */}
          <div className="group flex items-center gap-4 pt-3 sm:pt-0 sm:px-4 first:pt-0 first:px-0 rounded-xl hover:bg-sky-500/5 transition-colors duration-200 cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-[#e0f2fe]/80 dark:bg-sky-950/50 border border-sky-200/60 dark:border-sky-800/40 flex items-center justify-center shrink-0 text-[#0284c7] group-hover:scale-110 group-hover:bg-[#0284c7] group-hover:text-white transition-all duration-300">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 5-2.5 7 0" />
                <path d="M2 17c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 5-2.5 7 0" />
              </svg>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-[#0c2340] dark:text-white tracking-tight">
                <CountUp end={stats.totalFloats || 6} duration={1200} />
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Active Floats</p>
            </div>
          </div>

          {/* Stat 2: CTD Profiles */}
          <div className="group flex items-center gap-4 pt-3 sm:pt-0 sm:px-4 rounded-xl hover:bg-sky-500/5 transition-colors duration-200 cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-[#e0f2fe]/80 dark:bg-sky-950/50 border border-sky-200/60 dark:border-sky-800/40 flex items-center justify-center shrink-0 text-[#0284c7] group-hover:scale-110 group-hover:bg-[#0284c7] group-hover:text-white transition-all duration-300">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-[#0c2340] dark:text-white tracking-tight">
                <CountUp end={stats.cachedProfiles || 329652} separator="," duration={1800} />
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">CTD Profiles</p>
            </div>
          </div>

          {/* Stat 3: Avg Basin Temp */}
          <div className="group flex items-center gap-4 pt-3 sm:pt-0 sm:px-4 rounded-xl hover:bg-sky-500/5 transition-colors duration-200 cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-[#e0f2fe]/80 dark:bg-sky-950/50 border border-sky-200/60 dark:border-sky-800/40 flex items-center justify-center shrink-0 text-[#0284c7] group-hover:scale-110 group-hover:bg-[#0284c7] group-hover:text-white transition-all duration-300">
              <Thermometer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-[#0c2340] dark:text-white tracking-tight">
                <CountUp end={stats.avgTemperature || 14.1} decimals={1} suffix="°C" duration={1400} />
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Avg Basin Temp</p>
            </div>
          </div>

          {/* Stat 4: Indian Ocean Coverage */}
          <div className="group flex items-center gap-4 pt-3 sm:pt-0 sm:px-4 rounded-xl hover:bg-sky-500/5 transition-colors duration-200 cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-[#e0f2fe]/80 dark:bg-sky-950/50 border border-sky-200/60 dark:border-sky-800/40 flex items-center justify-center shrink-0 text-[#0284c7] group-hover:scale-110 group-hover:bg-[#0284c7] group-hover:text-white transition-all duration-300">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-[#0c2340] dark:text-white tracking-tight">
                <CountUp end={stats.dataCoverage || 100} suffix="%" duration={1400} />
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Indian Ocean Coverage</p>
            </div>
          </div>

        </div>
        </ScrollReveal>
      </div>

    </section>
  )
}

