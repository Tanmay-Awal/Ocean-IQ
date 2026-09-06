"use client"

import React, { useState, useEffect, useRef } from "react"
import Plotly from "plotly.js-dist-min"
import Link from "next/link"
import { 
  RotateCcw, 
  Radio, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Crosshair, 
  Compass,
  ArrowUpRight 
} from "lucide-react"
import { useTheme } from "@/lib/theme"

const FLOAT_COLORS: Record<string, string> = {
  "1902677": "#22d3ee",
  "2900230": "#38bdf8",
  "2900765": "#10b981",
  "2901092": "#f59e0b",
  "2902210": "#ec4899",
  "2902217": "#8b5cf6",
}

const getFloatColor = (wmo: string) => FLOAT_COLORS[wmo] ?? "#06b6d4"

const BASIN_PRESETS = [
  { name: "Arabian Sea", lon: 65, lat: 18 },
  { name: "Bay of Bengal", lon: 88, lat: 15 },
  { name: "Equatorial Basin", lon: 78, lat: -2 },
  { name: "Southern Indian", lon: 85, lat: -18 },
]

export function GlobeMap({ floats }: { floats: any[] }) {
  const { isDark } = useTheme()
  const [selectedFloat, setSelectedFloat] = useState<string | null>(null)
  const [coords, setCoords] = useState({ lon: 78, lat: 12 })
  const chartRef = useRef<HTMLDivElement>(null)
  
  // Center on Northern Indian Ocean
  const rotationRef = useRef({ lon: 78, lat: 12, roll: 0 })
  // 0.78 scale provides a clean, fully unclipped 3D sphere with zero boundary clipping
  const scaleRef = useRef<number>(0.78)

  const activeFloats = Array.isArray(floats) && floats.length > 0 ? floats : []
  const activeFloatObj = activeFloats.find(f => f.wmo === selectedFloat) || (activeFloats.length > 0 ? activeFloats[0] : null)

  const renderGlobe = () => {
    if (!chartRef.current || !Plotly) return

    const validFloats = activeFloats.filter(f => f.avg_latitude != null && f.avg_longitude != null)

    const lat = validFloats.map(f => f.avg_latitude)
    const lon = validFloats.map(f => f.avg_longitude)
    const text = validFloats.map(f => 
      `<b>WMO ${f.wmo}</b><br>` +
      `<span style="color:${isDark ? '#94a3b8' : '#475569'}">${f.region || 'Indian Ocean'}</span><br>` +
      `Profiles: <b>${f.measurements_count || 0}</b> | Temp: <b>${f.avg_temp ? f.avg_temp.toFixed(1) + '°C' : 'N/A'}</b>`
    )
    const colors = validFloats.map(f => getFloatColor(f.wmo))
    const sizes = validFloats.map(f => f.wmo === selectedFloat ? 22 : 11)

    const data: any[] = [
      {
        type: 'scattergeo',
        lat: lat,
        lon: lon,
        text: text,
        mode: 'markers+text',
        textposition: 'top center',
        hoverinfo: 'text',
        marker: {
          size: sizes,
          color: colors,
          line: {
            color: isDark ? '#030712' : '#ffffff',
            width: 2.5
          },
          opacity: 0.95
        },
        textfont: {
          family: 'var(--font-geist-mono), monospace',
          size: 11,
          color: isDark ? '#f8fafc' : '#0f172a'
        }
      }
    ]

    const layout: any = {
      geo: {
        projection: {
          type: 'orthographic',
          rotation: rotationRef.current,
          scale: scaleRef.current
        },
        showcoastlines: true,
        coastlinecolor: isDark ? 'rgba(56, 189, 248, 0.55)' : '#0284c7',
        coastlinewidth: 1.2,
        showland: true,
        landcolor: isDark ? '#0b1626' : '#e2e8f0',
        showocean: true,
        oceancolor: isDark ? '#040914' : '#f0f9ff',
        showlakes: true,
        lakecolor: isDark ? '#040914' : '#f0f9ff',
        showcountries: true,
        countrycolor: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(2, 132, 199, 0.25)',
        countrywidth: 0.8,
        bgcolor: 'transparent',
        lataxis: { 
          range: [-90, 90],
          showgrid: true,
          gridcolor: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.10)',
          gridwidth: 0.5
        },
        lonaxis: { 
          range: [-180, 180],
          showgrid: true,
          gridcolor: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.10)',
          gridwidth: 0.5
        },
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      margin: { t: 18, b: 18, l: 15, r: 15 },
      dragmode: 'pan',
      hovermode: 'closest'
    }

    const config = {
      displayModeBar: false,
      responsive: true,
      topojsonURL: '/topojson/'
    }

    Plotly.react(chartRef.current, data, layout, config)
    Plotly.Plots.resize(chartRef.current)

    const handleRelayout = (eventData: any) => {
      let updated = false
      if (eventData['geo.projection.rotation.lon'] !== undefined) {
        const newLon = Math.round(eventData['geo.projection.rotation.lon'] * 10) / 10
        const newLat = Math.round((eventData['geo.projection.rotation.lat'] ?? rotationRef.current.lat) * 10) / 10
        const newRoll = eventData['geo.projection.rotation.roll'] ?? rotationRef.current.roll
        rotationRef.current = { lon: newLon, lat: newLat, roll: newRoll }
        setCoords({ lon: newLon, lat: newLat })
        updated = true
      }
      if (eventData['geo.projection.scale'] !== undefined) {
        scaleRef.current = eventData['geo.projection.scale']
      }
    }

    const handleClick = (eventData: any) => {
      if (eventData?.points?.[0]) {
        const pointIdx = eventData.points[0].pointNumber
        const clicked = validFloats[pointIdx]
        if (clicked) {
          setSelectedFloat(clicked.wmo)
          setView(clicked.avg_longitude, clicked.avg_latitude, clicked.wmo)
        }
      }
    }

    ;(chartRef.current as any).on('plotly_relayout', handleRelayout)
    ;(chartRef.current as any).on('plotly_click', handleClick)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      renderGlobe()
    }, 60)
    return () => clearTimeout(timer)
  }, [floats, selectedFloat, isDark])

  // Window resize observer to ensure globe recalculates bounds
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && Plotly) {
        Plotly.Plots.resize(chartRef.current)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const setView = (lon: number, lat: number, wmo?: string) => {
    rotationRef.current = { lon, lat, roll: 0 }
    setCoords({ lon: Math.round(lon * 10) / 10, lat: Math.round(lat * 10) / 10 })
    if (wmo) setSelectedFloat(wmo)
    renderGlobe()
  }

  const resetView = () => {
    setSelectedFloat(null)
    scaleRef.current = 0.78
    setView(78, 12)
  }

  const cycleFloat = (dir: 1 | -1) => {
    const currentIndex = activeFloats.findIndex(f => f.wmo === activeFloatObj?.wmo)
    const nextIndex = (currentIndex + dir + activeFloats.length) % activeFloats.length
    const target = activeFloats[nextIndex]
    if (target) {
      setView(target.avg_longitude, target.avg_latitude, target.wmo)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Dedicated Globe Control Bar: Sub-Basin Target Presets + Live Rotation HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-0.5">
        {/* Sub-Basin Target Presets with Active Selection Highlight */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mr-1 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-ocean-cyan" />
            Basin:
          </span>
          {BASIN_PRESETS.map((preset) => {
            const isActive = Math.abs(coords.lon - preset.lon) < 5 && Math.abs(coords.lat - preset.lat) < 5
            return (
              <button
                key={preset.name}
                onClick={() => setView(preset.lon, preset.lat)}
                className={`text-[11px] font-mono px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-sm active:scale-95 font-semibold ${
                  isActive
                    ? 'bg-ocean-cyan/20 border-ocean-cyan text-ocean-cyan shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'bg-surface-elevated/80 border-border/80 text-foreground hover:text-ocean-cyan hover:border-ocean-cyan/50 hover:bg-surface-elevated'
                }`}
              >
                {preset.name}
              </button>
            )
          })}
        </div>

        {/* Live Rotation Telemetry + Reset View Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated/80 border border-border/80 text-[11px] font-mono shadow-sm">
            <span className="w-2 h-2 rounded-full bg-ocean-cyan animate-pulse" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">ROT:</span>
            <span className="text-foreground font-bold">
              {coords.lon >= 0 ? `${coords.lon}°E` : `${Math.abs(coords.lon)}°W`},{" "}
              {coords.lat >= 0 ? `${coords.lat}°N` : `${Math.abs(coords.lat)}°S`}
            </span>
          </div>
          <button
            onClick={resetView}
            className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg bg-surface-elevated/80 hover:bg-surface-elevated border border-border/80 text-foreground hover:text-ocean-cyan hover:border-ocean-cyan/40 transition-all cursor-pointer shadow-sm active:scale-95 font-semibold"
            title="Reset to Indian Ocean Center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset View</span>
          </button>
        </div>
      </div>

      {/* Modern 3D Globe Visualizer Command Center */}
      <div className="relative h-[480px] w-full rounded-2xl bg-gradient-to-b from-surface-card/90 via-surface-card/50 to-surface-card/90 border border-border/80 overflow-hidden flex items-center justify-center select-none shadow-inner group">
        
        {/* Atmospheric Planetary Glow Halo & Orbital Compass Reticle (Perfect Central Alignment) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          {/* Planetary Rayleigh scattering atmospheric halo */}
          <div 
            className="w-[360px] h-[360px] rounded-full blur-2xl opacity-70 dark:opacity-45 transition-all duration-700 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.30) 0%, rgba(2, 132, 199, 0.10) 45%, transparent 72%)'
            }}
          />
          {/* Orbital dashed radar guide ring */}
          <div className="absolute w-[390px] h-[390px] rounded-full border border-dashed border-ocean-cyan/25 dark:border-ocean-cyan/35 pointer-events-none" />
          <div className="absolute w-[416px] h-[416px] rounded-full border border-border/30 pointer-events-none hidden sm:block" />
          
          {/* Technical Reticle Corner Brackets */}
          <div className="absolute top-4 left-4 w-3.5 h-3.5 border-t-2 border-l-2 border-ocean-cyan/40 pointer-events-none" />
          <div className="absolute top-4 right-4 w-3.5 h-3.5 border-t-2 border-r-2 border-ocean-cyan/40 pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-3.5 h-3.5 border-b-2 border-l-2 border-ocean-cyan/40 pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-3.5 h-3.5 border-b-2 border-r-2 border-ocean-cyan/40 pointer-events-none" />
        </div>

        {/* Plotly Canvas Component */}
        <div ref={chartRef} className="w-full h-full cursor-grab active:cursor-grabbing z-0" />

        {/* Floating Target Telemetry Lock HUD Card (Right Side) */}
        {activeFloatObj && (
          <div className="absolute right-4 bottom-3 hidden md:flex flex-col gap-2.5 p-3.5 rounded-xl bg-surface-base/85 backdrop-blur-xl border border-border/80 shadow-2xl z-10 w-64 lg:w-72 transition-all">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-2.5 h-2.5 rounded-full animate-ping shrink-0" 
                  style={{ backgroundColor: getFloatColor(activeFloatObj.wmo) }} 
                />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ocean-cyan">
                  {selectedFloat ? "Telemetry Lock" : "Tracking Feed"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => cycleFloat(-1)} 
                  className="p-1 rounded-md hover:bg-surface-elevated text-slate-500 hover:text-foreground transition-colors cursor-pointer"
                  title="Previous float"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => cycleFloat(1)} 
                  className="p-1 rounded-md hover:bg-surface-elevated text-slate-500 hover:text-foreground transition-colors cursor-pointer"
                  title="Next float"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <h4 className="text-sm font-bold font-mono text-foreground flex items-center gap-1.5">
                  <span 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getFloatColor(activeFloatObj.wmo) }} 
                  />
                  WMO {activeFloatObj.wmo}
                </h4>
                <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-semibold">
                  {activeFloatObj.measurements_count || 0} cycles
                </span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate mt-0.5">
                {activeFloatObj.region || "Indian Ocean Basin"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
              <div className="p-1.5 rounded-lg bg-surface-elevated/70 border border-border/40">
                <span className="text-slate-500 block">Avg Temp</span>
                <span className="text-foreground font-bold text-xs">
                  {activeFloatObj.avg_temp ? `${activeFloatObj.avg_temp.toFixed(1)}°C` : '—'}
                </span>
              </div>
              <div className="p-1.5 rounded-lg bg-surface-elevated/70 border border-border/40">
                <span className="text-slate-500 block">Position</span>
                <span className="text-foreground font-bold text-xs">
                  {activeFloatObj.avg_latitude != null ? `${activeFloatObj.avg_latitude.toFixed(1)}°N` : '—'}
                </span>
              </div>
            </div>

            <Link
              href={`/chat?query=${encodeURIComponent(`Analyze thermodynamic and depth profile for float WMO ${activeFloatObj.wmo} in ${activeFloatObj.region || 'Indian Ocean'}`)}`}
              className="mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-ocean-cyan/15 hover:bg-ocean-cyan/25 border border-ocean-cyan/40 text-ocean-cyan text-xs font-semibold transition-colors cursor-pointer group"
            >
              <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
              <span>Ask Aqua AI</span>
              <ArrowUpRight className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        )}

        {/* Bottom Status Hint */}
        <div className="absolute bottom-3 left-4 flex items-center pointer-events-none z-10">
          <span className="text-[11px] font-mono text-slate-800 dark:text-slate-400 bg-surface-base/90 px-2.5 py-1 rounded-lg backdrop-blur-md border border-border font-medium shadow-sm flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-ocean-cyan" />
            <span>Drag to rotate &bull; Click marker to lock</span>
          </span>
        </div>

      </div>

      {/* Float Selector Dock with Active Ring & Telemetry Stats */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-mono text-slate-800 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
            <Radio className="w-3.5 h-3.5 text-ocean-cyan animate-pulse" /> Autonomous ARGO Array Array Trackers
          </span>
          {selectedFloat && (
            <button
              onClick={() => setSelectedFloat(null)}
              className="text-xs text-ocean-cyan hover:underline cursor-pointer font-semibold"
            >
              Clear selection
            </button>
          )}
        </div>

        {activeFloats.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface-card border border-border text-center text-xs font-mono text-slate-500">
            No active ARGO float telemetry available.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {activeFloats.map((float) => {
              const color = getFloatColor(float.wmo)
              const isSelected = selectedFloat === float.wmo
              return (
                <div
                  key={float.wmo}
                  onClick={() => setView(float.avg_longitude, float.avg_latitude, float.wmo)}
                  className={`flex flex-col p-3 rounded-xl cursor-pointer transition-all border card-hover-lift ${
                    isSelected 
                      ? 'border-ocean-cyan bg-ocean-cyan/15 shadow-[0_0_15px_rgba(6,182,212,0.25)] -translate-y-1 ring-1 ring-ocean-cyan/40' 
                      : 'border-border bg-surface-card hover:border-ocean-cyan/50 hover:bg-surface-elevated'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs font-mono font-bold text-foreground">
                        {float.wmo}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-700 dark:text-slate-400 font-medium">
                      {float.measurements_count || 0} pts
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-700 dark:text-slate-400 truncate mt-0.5 font-semibold" title={float.region}>
                    {float.region || "Indian Ocean"}
                  </p>
                  <div className="mt-1.5 pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Temp</span>
                    <span className="text-foreground font-bold">{float.avg_temp ? float.avg_temp.toFixed(1) + '°C' : '—'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
