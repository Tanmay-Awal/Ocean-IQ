"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Sun, Moon } from "lucide-react"
import { useTheme } from "@/lib/theme"

export function Navbar() {
  const { isDark, toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" })
      window.history.pushState(null, "", `#${targetId}`)
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/20 dark:bg-slate-950/30 backdrop-blur-xl border-b border-white/25 dark:border-white/10 shadow-[0_8px_32px_rgba(2,132,199,0.08)]"
          : "bg-transparent border-b border-transparent shadow-none"
      }`}
      style={{ borderTop: "none", borderLeft: "none", borderRight: "none" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2.5 group cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0284c7] via-[#06b6d4] to-[#38bdf8] flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7-0.5" />
              <path d="M2 17c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7-0.5" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0c2340] dark:text-white">
            Ocean<span className="text-[#0284c7]">IQ</span>
          </span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-700 dark:text-slate-200">
          <a
            href="#capabilities"
            onClick={(e) => handleNavClick(e, "capabilities")}
            className="hover:text-[#0284c7] transition-colors cursor-pointer"
          >
            Capabilities
          </a>
          <a
            href="#telemetry"
            onClick={(e) => handleNavClick(e, "telemetry")}
            className="hover:text-[#0284c7] transition-colors cursor-pointer"
          >
            Telemetry Engine
          </a>
          <Link
            href="/chat"
            className="text-[#0284c7] font-semibold hover:text-[#0369a1] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Aqua AI</span>
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* Subtle Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-[#0284c7] hover:bg-white/40 dark:hover:bg-slate-800/40 backdrop-blur-sm transition-all cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Launch Aqua AI Pill Button */}
          <Link href="/chat">
            <button className="h-10 px-5 rounded-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-white/10 text-[#0c2340] dark:text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-xs hover:shadow-md hover:bg-white/70 dark:hover:bg-slate-900/70 hover:border-[#0284c7]/50 active:scale-[0.98] transition-all cursor-pointer">
              <span>Launch Aqua AI</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 group-hover:text-[#0284c7]" />
            </button>
          </Link>
        </div>

      </div>
    </header>
  )
}

