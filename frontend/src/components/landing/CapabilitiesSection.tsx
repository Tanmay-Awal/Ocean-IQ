"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Globe, Sparkles, Database, GitBranch } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

const CAPABILITIES = [
  {
    icon: Globe,
    title: "Fleet Dashboard",
    description: "Track Argo floats, explore CTD profiles and monitor real-time fleet data.",
    href: "/dashboard"
  },
  {
    icon: Sparkles,
    title: "Aqua Research AI",
    description: "Ask questions, run analyses, and visualize results with natural language, fast.",
    href: "/chat"
  },
  {
    icon: Database,
    title: "Explorer & Export",
    description: "Explore telemetry, compare variables and export datasets.",
    href: "/explore"
  },
  {
    icon: GitBranch,
    title: "RAG Pipeline",
    description: "Build intelligent workflows with multi-stage AI reasoning.",
    href: "/chat"
  }
]

export function CapabilitiesSection() {
  return (
    <section 
      id="capabilities" 
      className="scroll-mt-24 relative isolate overflow-hidden -mt-28 sm:-mt-32 lg:-mt-36 z-10 pt-32 sm:pt-36 lg:pt-40 pb-28 sm:pb-32 lg:pb-36"
    >
      
      {/* High-Resolution Section 2 Background Image with Seamless Optical Feather */}
      <Image
        src="/Section-2-bg.png"
        alt="OceanIQ Capabilities Suite Background"
        fill
        priority
        unoptimized
        className="object-cover object-center pointer-events-none z-0"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 85px, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 85px, black 100%)'
        }}
      />

      <div className="max-w-7xl mx-auto px-6 space-y-12 relative z-10">
        
        {/* Header Grid: Left Title & Description + Right CTA */}
        <ScrollReveal direction="up" delay={100} duration={650}>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#bae6fd]/40 dark:bg-sky-950/70 border border-[#7dd3fc]/40 dark:border-sky-800/50 text-[#0284c7] dark:text-sky-300 font-semibold text-xs tracking-wider uppercase">
                POWERFUL CAPABILITIES
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#0c2340] dark:text-white leading-[1.18] tracking-tight">
                A Complete Oceanographic <br />
                Intelligence Suite
              </h2>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-xl">
                From real-time monitoring to AI-powered research, OceanIQ brings the ocean closer to you.
              </p>
            </div>

            <div className="shrink-0">
              <Link href="/dashboard">
                <button className="h-11 px-6 rounded-full bg-[#0c2340] hover:bg-[#07172b] dark:bg-white dark:text-[#0c2340] dark:hover:bg-slate-100 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  <span>Explore All Capabilities</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* 4 Vertical Capability Cards with Staggered ScrollReveal and smooth lift */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CAPABILITIES.map((cap, idx) => {
            const Icon = cap.icon
            return (
              <ScrollReveal key={idx} direction="up" delay={150 + idx * 100} duration={650} className="h-full">
                <Link
                  href={cap.href}
                  className="group relative h-full rounded-3xl bg-gradient-to-b from-white/35 via-white/20 to-white/10 dark:from-white/10 dark:via-white/5 dark:to-transparent dark:bg-slate-900/40 backdrop-blur-2xl p-7 border border-white/60 dark:border-white/15 shadow-[0_8px_32px_rgba(2,132,199,0.12),inset_0_1px_1px_rgba(255,255,255,0.7)] hover:border-cyan-300/80 dark:hover:border-cyan-400/50 hover:shadow-[0_20px_45px_rgba(2,132,199,0.22)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Floating Glass Icon Badge */}
                    <div className="w-13 h-13 rounded-2xl bg-white/60 dark:bg-sky-950/70 border border-white/80 dark:border-white/20 backdrop-blur-md shadow-xs flex items-center justify-center text-[#0284c7] dark:text-cyan-300 mb-6 group-hover:scale-110 group-hover:bg-[#0284c7] group-hover:text-white group-hover:border-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition-all duration-300">
                      <Icon className="w-6 h-6 transition-colors" />
                    </div>

                    <h3 className="text-lg font-bold text-[#0c2340] dark:text-white mb-2.5 group-hover:text-[#0284c7] dark:group-hover:text-cyan-300 transition-colors">
                      {cap.title}
                    </h3>

                    <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 font-normal leading-relaxed">
                      {cap.description}
                    </p>
                  </div>

                  <div className="pt-6 flex items-center text-xs font-semibold text-[#0284c7] dark:text-cyan-300 group-hover:translate-x-1 transition-all duration-200">
                    <span>Open Module</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </div>

                  {/* Subtle Luminous Bottom Accent Bar on Hover */}
                  <div className="absolute inset-x-6 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#0284c7] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </ScrollReveal>
            )
          })}
        </div>

      </div>
    </section>
  )
}

