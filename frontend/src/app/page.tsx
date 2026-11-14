"use client"

import React, { useState, useEffect } from "react"
import { Navbar } from "@/components/landing/Navbar"
import { HeroSection } from "@/components/landing/HeroSection"
import { CapabilitiesSection } from "@/components/landing/CapabilitiesSection"
import { Explore3DSection } from "@/components/landing/Explore3DSection"
import { AiResearchSection } from "@/components/landing/AiResearchSection"
import { HydrodynamicSection } from "@/components/landing/HydrodynamicSection"
import { CtaFooterSection } from "@/components/landing/CtaFooterSection"

export default function Home() {
  const [stats, setStats] = useState({
    totalFloats: 6,
    cachedProfiles: 329652,
    avgTemperature: 14.1,
    dataCoverage: 100
  })

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    fetch(`${apiUrl}/api/dashboard/stats`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.stats) {
          setStats({
            totalFloats: data.stats.totalFloats || 6,
            cachedProfiles: data.stats.cachedProfiles || 329652,
            avgTemperature: data.stats.avgTemperature || 14.1,
            dataCoverage: data.stats.dataCoverage || 100
          })
        }
      })
      .catch(() => {
        // Fallback default statistics matching oceanographic array
      })

    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.replace("#", "")
      const el = document.getElementById(id)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 200)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#07172b] text-[#0c2340] dark:text-slate-100 flex flex-col selection:bg-sky-500/20 selection:text-[#0284c7] transition-colors duration-300">
      
      {/* 1. Header Navigation */}
      <Navbar />

      {/* 2. Hero Section with Research Vessel & Telemetry Ribbon */}
      <main className="flex-1">
        <HeroSection stats={stats} />

        {/* 3. Powerful Capabilities Suite */}
        <CapabilitiesSection />

        {/* 4. Real-time Insights: Explore the Ocean in 3D */}
        <Explore3DSection />

        {/* 5. AI-Powered Research: From Questions to Discoveries */}
        <AiResearchSection />

        {/* 6. Hydrodynamic Calculations Engine */}
        <HydrodynamicSection />
      </main>

      {/* 8. Pre-Footer Underwater CTA Banner & Bottom Bar */}
      <CtaFooterSection />

    </div>
  )
}
