"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Play, Waves, Database, Thermometer, Compass } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

export function Explore3DSection() {
  return (
    <section className="relative isolate w-full min-h-[440px] sm:min-h-[480px] md:min-h-[520px] lg:min-h-[560px] xl:min-h-[600px] 2xl:min-h-[660px] flex items-center overflow-hidden -mt-28 sm:-mt-32 lg:-mt-36 z-20 pt-28 sm:pt-32 lg:pt-36 pb-24 sm:pb-28 lg:pb-32">
      
      {/* High-Resolution Authentic Background Image with Seamless Optical Feather */}
      <Image
        src="/section-3-bg-original.png"
        alt="Explore the Ocean in 3D: Telemetry Globe and Marine Ecosystem"
        fill
        priority
        unoptimized
        className="object-cover object-center pointer-events-none z-0"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 85px, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 85px, black 100%)'
        }}
      />

      {/* Section Content Overlay with Wide Grid so Card stays on the left edge away from the globe */}
      <div className="relative z-10 max-w-[1550px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-4 items-center">
          
          {/* Left Side: Floating Frosted Glass KPI Telemetry Card */}
          <div className="lg:col-span-3 flex justify-start">
            <ScrollReveal direction="left" delay={150} duration={700}>
              <div className="rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/90 dark:border-white/10 shadow-[0_16px_40px_rgba(2,132,199,0.12)] p-4 sm:p-5 space-y-3 sm:space-y-3.5 w-48 sm:w-52 transition-transform hover:scale-[1.02] duration-300">
                
                <div className="group flex items-center gap-3 p-1.5 -mx-1.5 rounded-xl hover:bg-sky-500/10 transition-all duration-200 cursor-default">
                  <div className="w-7 h-7 rounded-lg bg-sky-100/90 dark:bg-sky-950 text-[#0284c7] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                    <Waves className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-500 dark:text-slate-400 block font-semibold">Active Floats</span>
                    <span className="text-sm font-bold font-mono text-[#0c2340] dark:text-white">6</span>
                  </div>
                </div>

                <div className="group flex items-center gap-3 p-1.5 -mx-1.5 rounded-xl hover:bg-sky-500/10 transition-all duration-200 cursor-default">
                  <div className="w-7 h-7 rounded-lg bg-sky-100/90 dark:bg-sky-950 text-[#0284c7] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-500 dark:text-slate-400 block font-semibold">CTD Profiles</span>
                    <span className="text-sm font-bold font-mono text-[#0c2340] dark:text-white">329,652</span>
                  </div>
                </div>

                <div className="group flex items-center gap-3 p-1.5 -mx-1.5 rounded-xl hover:bg-sky-500/10 transition-all duration-200 cursor-default">
                  <div className="w-7 h-7 rounded-lg bg-sky-100/90 dark:bg-sky-950 text-[#0284c7] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                    <Thermometer className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-500 dark:text-slate-400 block font-semibold">Avg Temp</span>
                    <span className="text-sm font-bold font-mono text-[#0c2340] dark:text-white">14.1°C</span>
                  </div>
                </div>

                <div className="group flex items-center gap-3 p-1.5 -mx-1.5 rounded-xl hover:bg-sky-500/10 transition-all duration-200 cursor-default">
                  <div className="w-7 h-7 rounded-lg bg-sky-100/90 dark:bg-sky-950 text-[#0284c7] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                    <Compass className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-500 dark:text-slate-400 block font-semibold">Coverage</span>
                    <span className="text-sm font-bold font-mono text-[#0c2340] dark:text-white">100%</span>
                  </div>
                </div>

              </div>
            </ScrollReveal>
          </div>

          {/* Spacer Column: Gives dedicated breathing room to the 3D globe in section-3-bg.png */}
          <div className="lg:col-span-3 hidden lg:block" />

          {/* Right Side: Headline, Subtitle & Interactive Buttons */}
          <div className="lg:col-span-6 space-y-4 lg:pl-6 max-w-xl">
            <ScrollReveal direction="right" delay={250} duration={700}>
              <div className="space-y-4">
                {/* Eyebrow Label */}
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0284c7] tracking-[0.2em] uppercase">
                  <span>REAL-TIME INSIGHTS</span>
                  <span className="w-6 h-[1.5px] bg-[#0284c7]/60" />
                </div>

                {/* Serif Heading */}
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#0c2340] dark:text-white leading-[1.14] tracking-tight">
                  Explore the Ocean <br />
                  <span className="text-[#0284c7]">in 3D</span>
                </h2>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-normal leading-relaxed max-w-md">
                  Visualize Argo float trajectories, analyze ocean conditions, and discover patterns in real time.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link href="/dashboard">
                    <button className="h-11 px-6 rounded-full bg-[#0c2340] hover:bg-[#07172b] dark:bg-white dark:text-[#0c2340] dark:hover:bg-slate-100 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-black/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                      <span>Launch 3D Globe</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>

                  <Link href="/explore">
                    <button className="h-11 px-6 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300/80 dark:border-slate-700 text-[#0c2340] dark:text-white hover:bg-white font-medium text-sm flex items-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                      <span>Learn More</span>
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>

        </div>
      </div>

    </section>
  )
}
