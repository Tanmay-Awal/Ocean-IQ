"use client"

import React, { useEffect, useRef, useState } from "react"
import Plotly from "plotly.js-dist-min"
import { Maximize2, Minimize2, Download, RotateCcw } from "lucide-react"
import { useTheme } from "@/lib/theme"

interface PlotlyChartProps {
  data: any
  height?: string
  title?: string
}

const PlotlyChart: React.FC<PlotlyChartProps> = ({ data, height = "420px", title }) => {
  const { isDark } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const drawChart = () => {
    if (!containerRef.current || !Plotly || !data) return

    try {
      const cleanLayout = {
        ...data.layout,
        autosize: true,
        paper_bgcolor: "rgba(0, 0, 0, 0)",
        plot_bgcolor: "rgba(0, 0, 0, 0)",
        font: {
          color: isDark ? "#94a3b8" : "#475569",
          family: "var(--font-geist-mono), monospace",
          size: 11
        },
        margin: data.layout?.margin || { t: 30, b: 40, l: 50, r: 20 },
        hoverlabel: {
          bgcolor: isDark ? "#0b1324" : "#ffffff",
          bordercolor: isDark ? "#38bdf8" : "#0284c7",
          font: { color: isDark ? "#ffffff" : "#0f172a", family: "var(--font-geist-mono), monospace" }
        },
        xaxis: {
          ...data.layout?.xaxis,
          gridcolor: isDark ? "rgba(56, 189, 248, 0.08)" : "rgba(14, 165, 233, 0.12)",
          zerolinecolor: isDark ? "rgba(56, 189, 248, 0.2)" : "rgba(14, 165, 233, 0.25)",
          linecolor: isDark ? "rgba(56, 189, 248, 0.2)" : "rgba(14, 165, 233, 0.25)",
          tickfont: { color: isDark ? "#64748b" : "#475569" }
        },
        yaxis: {
          ...data.layout?.yaxis,
          gridcolor: isDark ? "rgba(56, 189, 248, 0.08)" : "rgba(14, 165, 233, 0.12)",
          zerolinecolor: isDark ? "rgba(56, 189, 248, 0.2)" : "rgba(14, 165, 233, 0.25)",
          linecolor: isDark ? "rgba(56, 189, 248, 0.2)" : "rgba(14, 165, 233, 0.25)",
          tickfont: { color: isDark ? "#64748b" : "#475569" }
        }
      }

      Plotly.react(
        containerRef.current,
        data.data || [],
        cleanLayout,
        {
          responsive: true,
          displayModeBar: false,
          showTips: false
        }
      )
    } catch (err) {
      console.error("Plotly rendering error:", err)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      drawChart()
    }, 60)

    const handleResize = () => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", handleResize)
    }
  }, [data, isFullscreen, isDark])

  const handleDownload = () => {
    if (containerRef.current) {
      Plotly.downloadImage(containerRef.current, {
        format: "png",
        filename: title ? `oceaniq_${title.toLowerCase().replace(/\s+/g, "_")}` : "oceaniq_ocean_profile",
        height: 800,
        width: 1200
      })
    }
  }

  const handleReset = () => {
    if (containerRef.current) {
      Plotly.relayout(containerRef.current, {
        "xaxis.autorange": true,
        "yaxis.autorange": true
      })
    }
  }

  return (
    <div className={`relative flex flex-col w-full bg-surface-card/70 rounded-2xl border border-border overflow-hidden transition-all ${isFullscreen ? 'fixed inset-4 z-50 bg-surface-base shadow-2xl p-4' : ''}`}>
      {/* Chart Top Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-surface-elevated/50">
        <span className="text-xs font-mono text-slate-800 dark:text-slate-300 font-semibold">
          {title || "Interactive Scientific Profile (Plotly.js)"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-ocean-cyan hover:bg-surface-hover transition-colors cursor-pointer"
            title="Reset Axes"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-500 hover:bg-surface-hover transition-colors cursor-pointer"
            title="Download PNG Image"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Chart Body */}
      <div className="w-full" style={{ height: isFullscreen ? "calc(100vh - 100px)" : height }}>
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  )
}

export default PlotlyChart
