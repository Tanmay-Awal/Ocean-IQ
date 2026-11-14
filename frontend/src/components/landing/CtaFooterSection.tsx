"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Waves } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

export function CtaFooterSection() {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" })
      window.history.pushState(null, "", `#${targetId}`)
    }
  }

  return (
    <footer className="relative isolate min-h-[580px] sm:min-h-[640px] md:min-h-[700px] lg:min-h-[740px] flex flex-col justify-between overflow-hidden -mt-28 sm:-mt-32 lg:-mt-36 z-50 pt-28 sm:pt-32 lg:pt-36">
      
      {/* Underwater Ocean Background extending through the entire footer */}
      <Image
        src="/last-section-bg.png"
        alt="OceanIQ Deep Ocean Exploration"
        fill
        priority
        unoptimized
        className="object-cover object-center pointer-events-none z-0"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 85px, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 85px, black 100%)'
        }}
      />

      {/* Center CTA Box with Scroll-Triggered Staggered Animations */}
      <div className="flex-1 flex items-center justify-center py-12 sm:py-16 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          
          {/* Eyebrow Label */}
          <ScrollReveal direction="down" delay={100} duration={600}>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0284c7] dark:text-cyan-300 tracking-[0.2em] uppercase">
              <span>START YOUR EXPEDITION</span>
              <span className="w-6 h-[1.5px] bg-[#0284c7]/60 dark:bg-cyan-300/60" />
            </div>
          </ScrollReveal>

          {/* Headline in Serif Display Typography */}
          <ScrollReveal direction="up" delay={200} duration={700}>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#0c2340] dark:text-white leading-[1.18] tracking-tight">
              Ready to Explore the Ocean <br />
              <span className="italic font-normal">Intelligently?</span>
            </h2>
          </ScrollReveal>

          {/* Subtitle */}
          <ScrollReveal direction="up" delay={300} duration={600}>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 max-w-xl mx-auto font-normal leading-relaxed">
              Launch OceanIQ and unlock the power of AI-driven oceanographic insights.
            </p>
          </ScrollReveal>

          {/* CTA Button with Pulsing Glow on Hover */}
          <ScrollReveal direction="up" delay={400} duration={600}>
            <div className="pt-2">
              <Link href="/dashboard">
                <button className="h-12 px-8 rounded-full bg-[#0c2340] hover:bg-[#07172b] dark:bg-white dark:text-[#0c2340] dark:hover:bg-slate-100 text-white font-medium text-sm inline-flex items-center gap-2.5 shadow-xl shadow-black/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer">
                  <span>Launch Operational Dashboard</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
            </div>
          </ScrollReveal>

        </div>
      </div>

      {/* Bottom Legal & Links Bar - integrated directly over ocean water with Fade In */}
      <ScrollReveal direction="fade" delay={300} duration={800} className="w-full">
        <div className="relative z-10 border-t border-white/20 py-6 bg-slate-950/20 backdrop-blur-md text-white">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#06b6d4] flex items-center justify-center text-white shadow-xs">
                <Waves className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-bold tracking-tight text-white drop-shadow-xs">
                OceanIQ
              </span>
              <span className="text-xs text-white/70 font-mono">
                • ARGO Oceanographic Telemetry
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-white/80">
              <a href="#capabilities" onClick={(e) => handleNavClick(e, "capabilities")} className="hover:text-cyan-300 transition-colors drop-shadow-xs">
                Capabilities
              </a>
              <a href="#telemetry" onClick={(e) => handleNavClick(e, "telemetry")} className="hover:text-cyan-300 transition-colors drop-shadow-xs">
                Telemetry
              </a>
              <Link href="/chat" className="hover:text-cyan-300 transition-colors text-cyan-300 font-semibold drop-shadow-xs">
                Aqua AI
              </Link>
              <Link href="/dashboard" className="hover:text-cyan-300 transition-colors drop-shadow-xs">
                Mission Control
              </Link>
              <span className="text-white/60">
                © {new Date().getFullYear()} OceanIQ. All rights reserved.
              </span>
            </div>

          </div>
        </div>
      </ScrollReveal>

    </footer>
  )
}
