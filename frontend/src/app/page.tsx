"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Waves, 
  Sparkles, 
  Activity, 
  Compass, 
  Database, 
  ArrowRight, 
  BarChart3, 
  Layers, 
  Radio, 
  ArrowUpRight,
  Flame,
  Droplets,
  Terminal,
  ShieldCheck,
  ChevronDown,
  Bot,
  Cpu,
  Search,
  Code,
  CheckCircle2,
  Zap,
  GitBranch,
  Binary
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ThemeToggle"
import { CountUp } from "@/components/ui/count-up"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { TerminalSimulation } from "@/components/TerminalSimulation"

export default function Home() {
  const router = useRouter()
  const [activePipelineTab, setActivePipelineTab] = useState<'prompt' | 'sql' | 'math' | 'output'>('prompt')
  const [stats, setStats] = useState({
    totalFloats: 0,
    cachedProfiles: 0,
    avgTemperature: 0,
    dataCoverage: 0
  })

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    fetch(`${apiUrl}/api/dashboard/stats`)
      .then(res => res.json())
      .then(data => {
        if (data && data.stats) {
          setStats({
            totalFloats: data.stats.totalFloats || 0,
            cachedProfiles: data.stats.cachedProfiles || 0,
            avgTemperature: data.stats.avgTemperature || 0,
            dataCoverage: data.stats.dataCoverage || 0
          })
        }
      })
      .catch(() => {
        // Zero fallback keeps clean state when backend telemetry is offline
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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.pushState(null, '', `#${targetId}`)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-ocean-cyan/20 selection:text-ocean-cyan transition-colors duration-300">
      
      {/* Top Floating Glass Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-surface-base/80 backdrop-blur-xl transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-ocean-cyan via-ocean-aqua to-ocean-blue flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-transform duration-300 hover:scale-105">
              <Waves className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Ocean<span className="text-ocean-cyan">IQ</span>
              </span>
              <span className="ml-2 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-surface-card border border-border text-slate-500 dark:text-slate-400">
                SCIENTIFIC PLATFORM
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-900 dark:text-slate-300">
            <a 
              href="#capabilities" 
              onClick={(e) => handleNavClick(e, 'capabilities')}
              className="hover:text-ocean-cyan transition-colors cursor-pointer"
            >
              Capabilities
            </a>
            <a 
              href="#telemetry" 
              onClick={(e) => handleNavClick(e, 'telemetry')}
              className="hover:text-ocean-cyan transition-colors cursor-pointer"
            >
              Telemetry Engine
            </a>
            <a 
              href="#architecture" 
              onClick={(e) => handleNavClick(e, 'architecture')}
              className="hover:text-ocean-cyan transition-colors cursor-pointer"
            >
              RAG Pipeline
            </a>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-xs font-semibold text-slate-900 dark:text-slate-200">
                Mission Control
              </Button>
            </Link>
            <Link href="/chat">
              <Button size="sm" variant="cyan" className="text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Launch Aqua AI
              </Button>
            </Link>
            
            {/* Classic Sun/Moon Theme Toggle */}
            <div className="pl-1 border-l border-border/40">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden">
        {/* Subtle dynamic background ocean currents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-ocean-blue/10 via-ocean-cyan/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />
        
        <div className="max-w-6xl mx-auto px-6 text-center space-y-8">
          
          {/* Status Chip */}
          <ScrollReveal direction="down" delay={50}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-card/90 border border-slate-300 dark:border-ocean-cyan/30 text-xs font-mono text-slate-900 dark:text-slate-300 shadow-[0_0_20px_rgba(6,182,212,0.12)] hover:border-ocean-cyan/60 transition-all cursor-default">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-bold text-slate-950 dark:text-white">ARGO GLOBAL TELEMETRY</span>
              <span className="text-slate-400 dark:text-slate-600">|</span>
              <span className="text-ocean-cyan font-bold">INDIAN OCEAN ARRAY LIVE</span>
            </div>
          </ScrollReveal>

          {/* Heading */}
          <ScrollReveal direction="up" delay={150}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
              AI-Powered Oceanographic <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-ocean-blue via-ocean-aqua to-ocean-cyan">
                Intelligence & Telemetry
              </span>
            </h1>
          </ScrollReveal>

          {/* Subtitle */}
          <ScrollReveal direction="up" delay={250}>
            <p className="text-base sm:text-lg md:text-xl text-slate-900 dark:text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
              Translate conversational queries into spatial SQL, calculate thermodynamic Mixed Layer Depths, detect thermocline anomalies, and visualize 3D bathymetric profiles in real time.
            </p>
          </ScrollReveal>

          {/* Action CTAs */}
          <ScrollReveal direction="up" delay={350}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" variant="cyan" className="w-full sm:w-auto px-8 gap-2.5 shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:-translate-y-0.5 transition-all">
                  <Compass className="w-5 h-5" />
                  <span>Launch Operational Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link href="/chat" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto px-8 gap-2.5 border-border hover:border-ocean-cyan/50 hover:-translate-y-0.5 transition-all text-slate-950 dark:text-slate-100 font-bold shadow-sm">
                  <Sparkles className="w-5 h-5 text-ocean-cyan" />
                  <span>Research with Aqua AI</span>
                </Button>
              </Link>
            </div>
          </ScrollReveal>

          {/* Real-time Telemetry Stats Ribbon with Animated Numbers */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            
            <ScrollReveal direction="up" delay={400} className="h-full">
              <div className="p-5 rounded-2xl glass-panel border border-border/80 card-hover-lift h-full flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-slate-800 dark:text-slate-400 uppercase tracking-wider font-semibold">Active Floats</span>
                  <Radio className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                  <CountUp end={stats.totalFloats} duration={1400} />
                </p>
                <p className="text-[11px] text-slate-800 dark:text-slate-400 mt-0.5 font-medium">Autonomous Profiling Units</p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={500} className="h-full">
              <div className="p-5 rounded-2xl glass-panel border border-border/80 card-hover-lift h-full flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-slate-800 dark:text-slate-400 uppercase tracking-wider font-semibold">CTD Profiles</span>
                  <Database className="w-4 h-4 text-ocean-cyan" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                  <CountUp end={stats.cachedProfiles} separator="," duration={1800} />
                </p>
                <p className="text-[11px] text-slate-800 dark:text-slate-400 mt-0.5 font-medium">Vertical Soundings Indexed</p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={600} className="h-full">
              <div className="p-5 rounded-2xl glass-panel border border-border/80 card-hover-lift h-full flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-slate-800 dark:text-slate-400 uppercase tracking-wider font-semibold">Avg Basin Temp</span>
                  <Flame className="w-4 h-4 text-rose-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                  <CountUp end={stats.avgTemperature} decimals={1} suffix="°C" duration={1600} />
                </p>
                <p className="text-[11px] text-slate-800 dark:text-slate-400 mt-0.5 font-medium">Upper Column Mean</p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={700} className="h-full">
              <div className="p-5 rounded-2xl glass-panel border border-border/80 card-hover-lift h-full flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-slate-800 dark:text-slate-400 uppercase tracking-wider font-semibold">Array Coverage</span>
                  <Activity className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                  <CountUp end={stats.dataCoverage} suffix="%" duration={1500} />
                </p>
                <p className="text-[11px] text-slate-800 dark:text-slate-400 mt-0.5 font-medium">Indian Ocean Sub-basins</p>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* Core Intelligence Modules Grid with Staggered Scroll Reveal */}
      <section id="capabilities" className="scroll-mt-20 py-16 md:py-24 border-t border-border/40 bg-surface-base/50">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          <ScrollReveal direction="up">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-mono text-ocean-cyan uppercase tracking-widest font-bold">
                Three Unified Workspaces
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Scientific Precision Meets Conversational AI
              </h2>
              <p className="text-sm sm:text-base text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                Seamlessly transition between fleet tracking, conversational reasoning, and high-density telemetry data extraction.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Module 1: Dashboard */}
            <ScrollReveal direction="up" delay={100} className="h-full">
              <div 
                onClick={() => router.push('/dashboard')}
                className="group glass-panel rounded-2xl p-7 border border-border/80 card-hover-lift flex flex-col justify-between cursor-pointer h-full"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-ocean-cyan/10 border border-ocean-cyan/30 flex items-center justify-center text-ocean-cyan mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Compass className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-950 dark:text-white mb-2 group-hover:text-ocean-cyan transition-colors flex items-center justify-between">
                    <span>Fleet Dashboard</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-ocean-cyan group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </h3>
                  <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed mb-6 font-medium">
                    Interactive 3D orthographic globe, real-time WMO trajectories, average vertical temperature profile curves, and fleet status monitoring.
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-border/40 text-xs font-mono text-slate-700 dark:text-slate-400 font-medium">
                  <div className="flex items-center justify-between">
                    <span>Projection</span>
                    <span className="text-foreground font-bold">Orthographic 3D</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Depth Resolution</span>
                    <span className="text-foreground font-bold">50m Binned CTD</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Module 2: Aqua Assistant */}
            <ScrollReveal direction="up" delay={200} className="h-full">
              <div 
                onClick={() => router.push('/chat')}
                className="group glass-panel rounded-2xl p-7 border border-border/80 card-hover-lift flex flex-col justify-between cursor-pointer relative overflow-hidden h-full"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-ocean-aqua/5 rounded-full blur-2xl pointer-events-none" />
                <div>
                  <div className="w-12 h-12 rounded-xl bg-ocean-aqua/10 border border-ocean-aqua/30 flex items-center justify-center text-ocean-aqua mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-950 dark:text-white mb-2 group-hover:text-ocean-aqua transition-colors flex items-center justify-between">
                    <span>Aqua Research AI</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-ocean-aqua group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </h3>
                  <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed mb-6 font-medium">
                    Dual-LLM scientific agent with Gemini 2.0 Thinking Mode and Groq Llama 3.3. Translates queries into SQL, executes thermodynamic math, and streams Plotly charts.
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-border/40 text-xs font-mono text-slate-700 dark:text-slate-400 font-medium">
                  <div className="flex items-center justify-between">
                    <span>Reasoning Engine</span>
                    <span className="text-foreground font-bold">Gemini 2.0 Flash / Thinking</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Dynamic Output</span>
                    <span className="text-foreground font-bold">Interactive Plotly + Markdown</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Module 3: Explore & Export */}
            <ScrollReveal direction="up" delay={300} className="h-full">
              <div 
                onClick={() => router.push('/explore')}
                className="group glass-panel rounded-2xl p-7 border border-border/80 card-hover-lift flex flex-col justify-between cursor-pointer h-full"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Database className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-950 dark:text-white mb-2 group-hover:text-emerald-500 transition-colors flex items-center justify-between">
                    <span>Explorer & Export</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </h3>
                  <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed mb-6 font-medium">
                    Compare thermodynamic variables between distinct floats, preview live telemetry soundings, and bundle filtered datasets into production CSVs.
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-border/40 text-xs font-mono text-slate-700 dark:text-slate-400 font-medium">
                  <div className="flex items-center justify-between">
                    <span>Thermodynamics</span>
                    <span className="text-foreground font-bold">MLD & Thermocline</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Data Format</span>
                    <span className="text-foreground font-bold">Raw PostGIS / CSV Stream</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* Deep Ocean Physics & Hydrodynamic Calculation Pipeline with Reveal */}
      <section id="telemetry" className="scroll-mt-20 py-16 md:py-24 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <ScrollReveal direction="left" duration={700}>
              <div className="space-y-6">
                <span className="text-xs font-mono text-ocean-cyan uppercase tracking-widest font-bold">
                  Hydrodynamic Calculations Engine
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  Automated Physical Oceanography at the Edge
                </h2>
                <p className="text-sm sm:text-base text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                  Eliminate tedious MATLAB and NetCDF processing. OceanIQ computes critical physical oceanography metrics instantaneously:
                </p>

                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl glass-panel border border-border/80 card-hover-lift">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm font-mono shadow-sm">
                        M
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-950 dark:text-white">Mixed Layer Depth</h4>
                        <p className="text-xs text-slate-800 dark:text-slate-300 font-medium">Calculates the upper ocean isothermal mixing boundary and thermodynamic layer depth.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl glass-panel border border-border/80 card-hover-lift">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm font-mono shadow-sm">
                        T
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-950 dark:text-white">Thermal Gradient Maxima</h4>
                        <p className="text-xs text-slate-800 dark:text-slate-300 font-medium">Identifies the steep temperature drop-off core and peak thermocline boundaries.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl glass-panel border border-border/80 card-hover-lift">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm font-mono shadow-sm">
                        S
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-950 dark:text-white">Salinity Stratification</h4>
                        <p className="text-xs text-slate-800 dark:text-slate-300 font-medium">Classifies high-salinity water masses, freshwater plumes, and basin haloclines.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Scientific Terminal Simulation Card with Live Continuous Animation */}
            <ScrollReveal direction="right" duration={700}>
              <TerminalSimulation />
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* Dual-Engine Oceanographic RAG Pipeline Section */}
      <section id="architecture" className="scroll-mt-20 py-20 md:py-28 border-t border-border/40 bg-surface-base/50 relative overflow-hidden">
        {/* Background ambient hydro-glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-ocean-cyan/10 via-ocean-blue/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-6 space-y-16">
          
          {/* Header */}
          <ScrollReveal direction="up">
            <div className="text-center space-y-3.5 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-card border border-ocean-cyan/30 text-xs font-mono text-ocean-cyan shadow-sm">
                <span className="w-2 h-2 rounded-full bg-ocean-cyan animate-pulse" />
                <span>HYBRID RAG & GEOSPATIAL VECTOR PIPELINE</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                Dual-Engine Oceanographic Architecture
              </h2>
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                How Aqua translates natural language into vectorized spatial SQL, executes thermodynamic differential equations, and streams interactive Plotly depth profiles in real time.
              </p>
            </div>
          </ScrollReveal>

          {/* 4 Architectural Pipeline Stages */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Stage 1 */}
            <ScrollReveal direction="up" delay={100} className="h-full">
              <div className="p-6 rounded-2xl glass-panel border border-border/80 card-hover-lift h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono font-bold text-ocean-cyan px-2.5 py-0.5 rounded-md bg-ocean-cyan/10 border border-ocean-cyan/20">
                      STAGE 01
                    </span>
                    <Bot className="w-5 h-5 text-ocean-cyan" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">
                    Intent & Geo-Parsing
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-4 font-medium">
                    <code className="text-[11px] font-mono text-ocean-cyan bg-surface-elevated px-1 py-0.5 rounded border border-border">IntentService</code> classifies prompt targets (CTD curves, MLD, T-S water masses). <code className="text-[11px] font-mono text-ocean-cyan bg-surface-elevated px-1 py-0.5 rounded border border-border">GeocoderService</code> resolves named coastal zones via OpenStreetMap Nominatim into coordinate bounding boxes.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/40 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  <span className="text-slate-900 dark:text-slate-200 font-semibold">Engine:</span> OSM Nominatim • Regex Entity Parser
                </div>
              </div>
            </ScrollReveal>

            {/* Stage 2 */}
            <ScrollReveal direction="up" delay={200} className="h-full">
              <div className="p-6 rounded-2xl glass-panel border border-border/80 card-hover-lift h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono font-bold text-ocean-aqua px-2.5 py-0.5 rounded-md bg-ocean-aqua/10 border border-ocean-aqua/20">
                      STAGE 02
                    </span>
                    <Layers className="w-5 h-5 text-ocean-aqua" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">
                    Hybrid Dual Ingestion
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-4 font-medium">
                    <code className="text-[11px] font-mono text-ocean-aqua bg-surface-elevated px-1 py-0.5 rounded border border-border">ChromaDB</code> executes vector semantic search over float metadata using <code className="text-[11px] font-mono text-ocean-aqua bg-surface-elevated px-1 py-0.5 rounded border border-border">text-embedding-004</code>. Simultaneously, parameter-safe SQL streams raw pressure, temperature, salinity, and dissolved oxygen rows from Neon PostgreSQL.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/40 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  <span className="text-slate-900 dark:text-slate-200 font-semibold">Storage:</span> ChromaDB Vectors • Neon PostgreSQL
                </div>
              </div>
            </ScrollReveal>

            {/* Stage 3 */}
            <ScrollReveal direction="up" delay={300} className="h-full">
              <div className="p-6 rounded-2xl glass-panel border border-border/80 card-hover-lift h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono font-bold text-purple-500 px-2.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                      STAGE 03
                    </span>
                    <Cpu className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">
                    Vectorized Ocean Math
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-4 font-medium">
                    <code className="text-[11px] font-mono text-purple-500 bg-surface-elevated px-1 py-0.5 rounded border border-border">AnalysisService</code> computes physical oceanography algorithms directly in memory: MLD via ΔT = 0.2°C surface threshold, thermocline maxima via discrete NumPy gradients max(dT/dz), and T-S water mass classification.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/40 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  <span className="text-slate-900 dark:text-slate-200 font-semibold">Calculations:</span> NumPy Diffs • SciPy • Pandas
                </div>
              </div>
            </ScrollReveal>

            {/* Stage 4 */}
            <ScrollReveal direction="up" delay={400} className="h-full">
              <div className="p-6 rounded-2xl glass-panel border border-border/80 card-hover-lift h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono font-bold text-emerald-500 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                      STAGE 04
                    </span>
                    <Sparkles className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">
                    Dual Synthesis & SSE
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-4 font-medium">
                    Packages scientific context for <code className="text-[11px] font-mono text-emerald-500 bg-surface-elevated px-1 py-0.5 rounded border border-border">Gemini 2.0 Thinking</code> and <code className="text-[11px] font-mono text-emerald-500 bg-surface-elevated px-1 py-0.5 rounded border border-border">Groq Llama 3.3</code>. Streams real-time Markdown tokens while simultaneously delivering interactive Plotly JSON depth profiles with zero blocking latency.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/40 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  <span className="text-slate-900 dark:text-slate-200 font-semibold">Stream:</span> SSE Stream • Plotly.js • Groq Llama
                </div>
              </div>
            </ScrollReveal>

          </div>

          {/* Interactive Live Query Execution Simulation Box */}
          <ScrollReveal direction="up" delay={200}>
            <div className="rounded-2xl glass-panel border border-border/90 overflow-hidden shadow-xl">
              
              {/* Box Header Toolbar with Interactive Tabs */}
              <div className="px-6 py-4 border-b border-border/50 bg-surface-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono font-bold text-foreground">
                    Live Pipeline Inspector: WMO 2902217 Query Execution
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-base border border-border text-xs font-mono">
                  <button
                    onClick={() => setActivePipelineTab('prompt')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                      activePipelineTab === 'prompt'
                        ? 'bg-ocean-cyan text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-foreground'
                    }`}
                  >
                    1. Input Prompt
                  </button>
                  <button
                    onClick={() => setActivePipelineTab('sql')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                      activePipelineTab === 'sql'
                        ? 'bg-ocean-cyan text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-foreground'
                    }`}
                  >
                    2. Spatial SQL & Vector
                  </button>
                  <button
                    onClick={() => setActivePipelineTab('math')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                      activePipelineTab === 'math'
                        ? 'bg-ocean-cyan text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-foreground'
                    }`}
                  >
                    3. Physics Math
                  </button>
                  <button
                    onClick={() => setActivePipelineTab('output')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                      activePipelineTab === 'output'
                        ? 'bg-ocean-cyan text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-foreground'
                    }`}
                  >
                    4. Synthesis & Plotly
                  </button>
                </div>
              </div>

              {/* Tab Content Display */}
              <div className="p-6 md:p-8 bg-surface-base/80">
                {activePipelineTab === 'prompt' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                      <span className="font-bold text-ocean-cyan uppercase tracking-wider">Natural Language Query Ingestion</span>
                      <span>Format: UTF-8 Natural Language</span>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-card border border-border/80 text-foreground font-mono text-sm leading-relaxed">
                      &quot;Calculate Mixed Layer Depth and plot CTD vertical profile for float WMO 2902217 in the Northern Bay of Bengal.&quot;
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                      <div className="p-3 rounded-lg bg-surface-card border border-border/60">
                        <span className="text-slate-500 block mb-1 font-semibold">Identified Intent</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">PLOT_PROFILE_WITH_MLD</span>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-card border border-border/60">
                        <span className="text-slate-500 block mb-1 font-semibold">Parsed Entity</span>
                        <span className="text-ocean-cyan font-bold">WMO 2902217 (APEX Float)</span>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-card border border-border/60">
                        <span className="text-slate-500 block mb-1 font-semibold">Geocoded Bounds</span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold">16.5°N - 22.0°N, 87.0°E - 93.5°E</span>
                      </div>
                    </div>
                  </div>
                )}

                {activePipelineTab === 'sql' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                      <span className="font-bold text-ocean-cyan uppercase tracking-wider">Vector Semantic Retrieval & PostgreSQL Query</span>
                      <span>Latency: ~38ms</span>
                    </div>
                    <pre className="p-4 rounded-xl bg-surface-card border border-border/80 text-foreground font-mono text-xs overflow-x-auto leading-relaxed">
                      {`-- 1. ChromaDB Vector Metadata Match (Cosine Distance: 0.12)
-- Embedding model: text-embedding-004 (768-dimensional float embedding)
-- Matched WMO 2902217: "Northern Bay of Bengal APEX profiling float, 169 cycles"

-- 2. Parameterized Postgres Query Execution (Neon Serverless)
SELECT wmo, profile_date, cycle_number, latitude, longitude,
       temp, pres, psal, doxy_umolkg
FROM argo_profiles
WHERE wmo = '2902217'
  AND pres BETWEEN 0 AND 2000
ORDER BY cycle_number DESC, pres ASC
LIMIT 500;`}
                    </pre>
                  </div>
                )}

                {activePipelineTab === 'math' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                      <span className="font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">AnalysisService Vectorized Oceanographic Engine</span>
                      <span>Vectorized NumPy / SciPy</span>
                    </div>
                    <pre className="p-4 rounded-xl bg-surface-card border border-border/80 text-foreground font-mono text-xs overflow-x-auto leading-relaxed">
                      {`# Step 1: Mixed Layer Depth (MLD) Calculation
# Threshold Method: |T(z) - T(10m)| >= 0.2°C
ref_temp = profile_df.loc[(profile_df['pres'] - 10).abs().idxmin()]['temp']  # 28.2°C
mld_row  = profile_df[(profile_df['temp'] - ref_temp).abs() >= 0.2].iloc[0]
mld_db   = mld_row['pres']  # Calculated MLD: 42.1 dbar (~42.1 meters)

# Step 2: Thermocline Gradient Maxima
dz = np.diff(profile_df['pres'])
dT = np.diff(profile_df['temp'])
gradient = np.abs(dT / dz)
thermocline_depth = profile_df['pres'].iloc[np.argmax(gradient)]  # 85.5 dbar
max_gradient      = np.max(gradient)                             # 0.38 °C/dbar`}
                    </pre>
                    <div className="flex flex-wrap gap-2 text-xs font-mono pt-1">
                      <span className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-semibold">
                        MLD: 42.1 dbar
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold">
                        Thermocline: 85.5 dbar
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 font-semibold">
                        Max Gradient: 0.38 °C/dbar
                      </span>
                    </div>
                  </div>
                )}

                {activePipelineTab === 'output' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Dual-LLM Reasoning & Plotly SSE Synthesis</span>
                      <span>Gemini 2.0 Thinking Mode • SSE Stream</span>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-card border border-border/80 text-xs font-sans leading-relaxed text-slate-800 dark:text-slate-300 space-y-2">
                      <div className="flex items-center gap-2 text-ocean-cyan font-mono font-bold text-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Aqua Oceanographic Diagnosis</span>
                      </div>
                      <p className="font-medium">
                        Float <strong>2902217</strong> shows a distinct stratified layer in the Northern Bay of Bengal. The surface isothermal layer extends to <strong>42.1 meters</strong> (MLD), where the temperature begins a steep gradient drop. Peak thermocline occurs at <strong>85.5 dbar</strong> with a maximum gradient of <strong>0.38°C/dbar</strong>.
                      </p>
                      <div className="pt-2 border-t border-border/40 font-mono text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Payload: Plotly.js CTD Scatter/Line Schema Dispatched</span>
                        <span className="text-emerald-500 font-bold">✓ Verification Complete</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Resilient Architecture Multi-Layer Guarantee */}
          <ScrollReveal direction="up" delay={300}>
            <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-ocean-cyan/10 via-surface-card to-ocean-blue/10 border border-ocean-cyan/30 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 text-ocean-cyan font-mono text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Resilient Edge Architecture</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  Zero-Downtime Multi-Tiered Fallback Engine
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-2xl font-medium leading-relaxed">
                  Even during external LLM outages or rate limits, OceanIQ falls back autonomously to deterministic local NumPy thermodynamic solvers and local ONNX vector embeddings. You never lose scientific calculation access.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link href="/chat">
                  <Button variant="cyan" size="sm" className="shadow-md gap-2 font-semibold">
                    <Sparkles className="w-4 h-4" />
                    <span>Try Aqua RAG</span>
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button variant="secondary" size="sm" className="font-semibold text-foreground">
                    <span>Inspect Raw Data</span>
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 py-8 bg-surface-base/80">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-ocean-cyan to-ocean-blue flex items-center justify-center">
              <Waves className="w-3.5 h-3.5 text-slate-950 font-bold" />
            </div>
            <span className="text-sm font-bold text-foreground">OceanIQ</span>
            <span className="text-xs text-slate-700 dark:text-slate-400 font-mono font-medium">Autonomous Ocean Intelligence</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-800 dark:text-slate-400">
            <a href="#capabilities" onClick={(e) => handleNavClick(e, 'capabilities')} className="hover:text-ocean-cyan transition-colors cursor-pointer">Capabilities</a>
            <a href="#telemetry" onClick={(e) => handleNavClick(e, 'telemetry')} className="hover:text-ocean-cyan transition-colors cursor-pointer">Telemetry</a>
            <a href="#architecture" onClick={(e) => handleNavClick(e, 'architecture')} className="hover:text-ocean-cyan transition-colors cursor-pointer text-ocean-cyan font-bold">RAG Pipeline</a>
            <Link href="/dashboard" className="hover:text-ocean-cyan transition-colors">Dashboard</Link>
            <Link href="/chat" className="hover:text-ocean-cyan transition-colors">Aqua AI</Link>
            <span className="text-slate-600 dark:text-slate-500 font-normal">© 2026 OceanIQ</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
