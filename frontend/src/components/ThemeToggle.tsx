"use client"

import React, { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/lib/theme"

interface ThemeToggleProps {
  className?: string
  compact?: boolean
}

export function ThemeToggle({ className = "", compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render placeholder with matching dimensions to prevent layout shift
    return (
      <div 
        className={`w-9 h-9 rounded-xl border border-border/60 bg-surface-card/60 ${className}`} 
        aria-hidden="true" 
      />
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative group inline-flex items-center justify-center rounded-xl p-2 transition-all duration-300 cursor-pointer border ${
        isDark
          ? "border-border/70 bg-surface-card/80 text-amber-400 hover:border-amber-400/40 hover:bg-surface-elevated hover:shadow-[0_0_15px_rgba(251,191,36,0.15)]"
          : "border-border/70 bg-surface-card/90 text-ocean-blue hover:border-ocean-blue/40 hover:bg-surface-elevated hover:shadow-[0_0_15px_rgba(2,132,199,0.15)]"
      } ${className}`}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun
          className={`w-4 h-4 transition-all duration-500 transform ${
            isDark
              ? "rotate-90 scale-0 opacity-0 absolute"
              : "rotate-0 scale-100 opacity-100 text-amber-500"
          }`}
        />
        {/* Moon Icon */}
        <Moon
          className={`w-4 h-4 transition-all duration-500 transform ${
            isDark
              ? "rotate-0 scale-100 opacity-100 text-sky-400"
              : "-rotate-90 scale-0 opacity-0 absolute"
          }`}
        />
      </div>
      {!compact && (
        <span className="sr-only">
          {isDark ? "Switch to light mode" : "Switch to dark mode"}
        </span>
      )}
    </button>
  )
}
