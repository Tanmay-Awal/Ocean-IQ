"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  MessageSquare, 
  Database, 
  Waves, 
  Plus, 
  Trash2, 
  Radio, 
  Menu, 
  X, 
  Search, 
  Cpu, 
  CheckCircle2, 
  ChevronDown, 
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRecentChats, chatStore } from "@/lib/chatStore"
import { ThemeToggle } from "@/components/ThemeToggle"

const navItems = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: LayoutDashboard,
    badge: "6 Units",
    description: "Fleet metrics & 3D globe" 
  },
  { 
    name: "Aqua Assistant", 
    href: "/chat", 
    icon: MessageSquare,
    badge: "Gemini 2.0",
    description: "Conversational ocean science" 
  },
  { 
    name: "Explore & Export", 
    href: "/explore", 
    icon: Database,
    badge: "332k Pts",
    description: "Comparison & CSV exports" 
  },
]

const FALLBACK_FLOATS = [
  { wmo: "2902217", region: "Arabian Sea", temp: "28.2°C", status: "Active" },
  { wmo: "2902210", region: "Bay of Bengal", temp: "29.1°C", status: "Active" },
  { wmo: "1902677", region: "S. Indian Basin", temp: "14.8°C", status: "Active" },
  { wmo: "2900230", region: "Equatorial Zone", temp: "24.5°C", status: "Active" },
  { wmo: "2900765", region: "W. Australia", temp: "19.4°C", status: "Active" },
  { wmo: "2901092", region: "SW Indian Ridge", temp: "16.2°C", status: "Active" }
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const recentChats = useRecentChats()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFloats, setShowFloats] = useState(true)
  const [floatsData, setFloatsData] = useState<any[]>(FALLBACK_FLOATS)
  const [fleetStats, setFleetStats] = useState<{ activeFloats: number | null; totalProfiles: number | null }>({
    activeFloats: 6,
    totalProfiles: 332399
  })

  // Restore collapsed state preference from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("oceaniq_sidebar_collapsed")
      if (saved === "true") setIsCollapsed(true)
    }
  }, [])

  // Keyboard shortcut: Command+B / Ctrl+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault()
        toggleCollapsed()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem("oceaniq_sidebar_collapsed", String(next))
      }
      return next
    })
  }

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    
    // Fetch aggregated fleet stats
    fetch(`${apiUrl}/api/dashboard/stats`)
      .then(res => res.json())
      .then(data => {
        if (data && data.stats) {
          setFleetStats({
            activeFloats: data.stats.totalFloats ?? 6,
            totalProfiles: data.stats.cachedProfiles ?? 332399
          })
        }
      })
      .catch(() => {})

    // Fetch active floats list
    fetch(`${apiUrl}/api/floats`)
      .then(res => res.json())
      .then(data => {
        if (data && data.floats && data.floats.length > 0) {
          setFloatsData(data.floats.slice(0, 6).map((f: any) => ({
            wmo: f.wmo,
            region: f.region || "Indian Ocean",
            temp: f.avg_temp != null ? `${Number(f.avg_temp).toFixed(1)}°C` : "24.0°C",
            status: f.active || "Active"
          })))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && pathname === "/chat") {
      const params = new URLSearchParams(window.location.search)
      setActiveChatId(params.get("chatId"))
    } else {
      setActiveChatId(null)
    }
  }, [pathname])

  const handleDeleteChat = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    chatStore.deleteChat(id)
    if (activeChatId === id) {
      router.push("/chat")
    }
  }

  const handleNewChat = () => {
    setMobileOpen(false)
    router.push("/chat")
  }

  // Filtered chats based on search input
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return recentChats
    const q = searchQuery.toLowerCase()
    return recentChats.filter(c => c.title.toLowerCase().includes(q))
  }, [recentChats, searchQuery])

  return (
    <>
      {/* Mobile Top App Bar */}
      <div className="md:hidden sticky top-0 left-0 right-0 h-14 bg-white/90 dark:bg-[#071326]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 z-40 px-4 flex items-center justify-between transition-colors duration-300">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0284c7] via-[#06b6d4] to-[#38bdf8] flex items-center justify-center shadow-sm">
            <Waves className="w-4 h-4 text-white font-bold" />
          </div>
          <span className="text-base font-bold tracking-tight text-[#0c2340] dark:text-white">
            Ocean<span className="text-[#0284c7]">IQ</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-9 h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-foreground cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 
        DESKTOP SILKY-SMOOTH COLLAPSIBLE SIDEBAR
        Fixed inner rail (320px) inside an overflow-hidden width-tweening outer container (320px <-> 72px).
        Icons are locked at stationary coordinates to eliminate layout snapping and text wrapping thrash.
      */}
      <aside 
        className={cn(
          "hidden md:flex flex-col h-screen sticky top-0 z-40 bg-white/80 dark:bg-[#071326]/90 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10 shadow-[4px_0_24px_rgba(2,132,199,0.03)] select-none shrink-0 overflow-hidden will-change-[width]",
          "transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isCollapsed ? "w-[72px]" : "w-80"
        )}
      >
        {/* Fixed Width Inner Wrapper to maintain rock-solid layout integrity without child wrapping */}
        <div className="w-80 h-full flex flex-col shrink-0">
          
          {/* 1. Header Section */}
          <div className="h-16 px-4 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <Link 
                href="/" 
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0284c7] via-[#06b6d4] to-[#38bdf8] flex items-center justify-center shadow-md shadow-cyan-500/20 hover:scale-105 transition-transform duration-200 shrink-0" 
                title="OceanIQ Home"
              >
                <Waves className="w-5 h-5 text-white font-bold" />
              </Link>
              
              {/* Brand Label - Smooth Opacity & Slide */}
              <div className={cn(
                "flex flex-col whitespace-nowrap overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isCollapsed ? "opacity-0 -translate-x-3 pointer-events-none" : "opacity-100 translate-x-0"
              )}>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold tracking-tight text-[#0c2340] dark:text-white">
                    Ocean<span className="text-[#0284c7]">IQ</span>
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950/80 text-[#0284c7] dark:text-cyan-300 border border-sky-200 dark:border-sky-800/50 font-semibold">
                    v2.0
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Indian Ocean Array
                </p>
              </div>
            </div>

            {/* Header Right Actions (Expanded mode) */}
            <div className={cn(
              "flex items-center gap-1 shrink-0 transition-opacity duration-200",
              isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
              <button
                onClick={handleNewChat}
                className="h-7 px-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-[#0284c7] hover:text-white border border-sky-200/60 dark:border-sky-800/40 text-[11px] font-mono font-semibold text-[#0284c7] dark:text-cyan-300 flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                title="Launch new research query"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>

              <button
                onClick={toggleCollapsed}
                className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-400 hover:text-foreground flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Collapse sidebar (⌘B)"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsed Mode Actions Row (Expand & Quick New Chat) */}
          <div className={cn(
            "w-[72px] flex flex-col items-center gap-1.5 py-2.5 border-b border-slate-200/50 dark:border-white/10 shrink-0 transition-all duration-200",
            isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none max-h-0 py-0 border-none overflow-hidden"
          )}>
            <button
              onClick={toggleCollapsed}
              className="w-10 h-10 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-[#0284c7] hover:text-white dark:hover:bg-cyan-500 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer group shadow-2xs"
              title="Expand sidebar (⌘B)"
            >
              <PanelLeftOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>

            <button
              onClick={handleNewChat}
              className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-[#0284c7] hover:text-white border border-sky-200/60 dark:border-sky-800/40 text-[#0284c7] dark:text-cyan-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
              title="New Research Query"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>

          {/* Quick Search Bar (Expanded mode) */}
          <div className={cn(
            "px-4 pt-3 pb-1 shrink-0 transition-opacity duration-200",
            isCollapsed ? "opacity-0 pointer-events-none max-h-0 pt-0 overflow-hidden" : "opacity-100"
          )}>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter sessions or floats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-8 rounded-lg bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-white/10 text-xs text-foreground placeholder:text-slate-400 focus:outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7]/20 transition-all font-mono"
              />
              {searchQuery ? (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-foreground text-[10px] font-mono cursor-pointer"
                >
                  Clear
                </button>
              ) : (
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono px-1 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-500 pointer-events-none">
                  ⌘K
                </kbd>
              )}
            </div>
          </div>

          {/* 2. Primary Navigation Modules */}
          <div className="p-3 border-b border-slate-200/50 dark:border-white/10 shrink-0">
            <div className={cn(
              "flex items-center justify-between px-2 mb-1.5 transition-opacity duration-200",
              isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
              <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Core Modules
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                ● All Systems Nom
              </span>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={item.name}
                    className={cn(
                      "flex items-center h-11 rounded-xl transition-all group relative overflow-hidden",
                      isActive 
                        ? "bg-[#0284c7]/10 dark:bg-cyan-500/10 text-[#0284c7] dark:text-cyan-300 font-bold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r before:bg-[#0284c7] dark:before:bg-cyan-400" 
                        : "text-slate-700 dark:text-slate-300 hover:text-[#0284c7] dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50 font-medium"
                    )}
                  >
                    {/* Fixed Icon Anchor: stationary position centered within 72px rail */}
                    <div className="w-12 h-11 flex items-center justify-center shrink-0">
                      <Icon className={cn(
                        "w-5 h-5 transition-colors", 
                        isActive ? "text-[#0284c7] dark:text-cyan-400" : "text-slate-400 group-hover:text-[#0284c7]"
                      )} />
                    </div>

                    {/* Fluid Text Label & Badge */}
                    <div className={cn(
                      "flex items-center justify-between flex-1 min-w-0 pr-3 transition-opacity duration-200",
                      isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
                    )}>
                      <span className="text-xs truncate tracking-tight">
                        {item.name}
                      </span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded font-mono font-semibold shrink-0 ml-2",
                        isActive 
                          ? "bg-white/80 dark:bg-slate-900 text-[#0284c7] dark:text-cyan-300 border border-[#0284c7]/20 shadow-2xs" 
                          : "text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/40"
                      )}>
                        {item.badge}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* 3. Live Active Float Fleet (Telemetry Section) */}
          <div className={cn(
            "px-3 py-2 border-b border-slate-200/50 dark:border-white/10 shrink-0 transition-opacity duration-200",
            isCollapsed ? "opacity-0 pointer-events-none max-h-0 py-0 border-none overflow-hidden" : "opacity-100"
          )}>
            <div 
              onClick={() => setShowFloats(!showFloats)}
              className="flex items-center justify-between px-2 cursor-pointer group py-1"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider group-hover:text-foreground transition-colors">
                  Active Fleet Profilers
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold">
                  {floatsData.length}
                </span>
              </div>
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", !showFloats && "-rotate-90")} />
            </div>

            {showFloats && (
              <div className="mt-1.5 space-y-0.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                {floatsData.map((f) => (
                  <Link
                    key={f.wmo}
                    href={`/chat?query=${encodeURIComponent(`Analyze float ${f.wmo} in ${f.region}`)}`}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all text-[11px] font-mono group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-bold text-[#0c2340] dark:text-slate-200 group-hover:text-[#0284c7] transition-colors">
                        WMO {f.wmo}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 truncate text-[10px]">
                        {f.region}
                      </span>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0 group-hover:text-[#0284c7]">
                      {f.temp}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 4. Research Query Sessions */}
          <div className={cn(
            "flex-1 overflow-hidden flex flex-col min-h-0 px-3 py-3 transition-opacity duration-200",
            isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
          )}>
            <div className="flex items-center justify-between px-2 mb-2 shrink-0">
              <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Research Sessions ({filteredChats.length})
              </span>
              <button
                onClick={handleNewChat}
                className="text-slate-400 hover:text-[#0284c7] transition-colors p-1 cursor-pointer"
                title="New research session"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5 overflow-y-auto flex-1 pr-1 scrollbar-thin">
              {filteredChats.length === 0 ? (
                <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400 font-medium my-auto">
                  <p>{searchQuery ? "No matching queries" : "No stored queries"}</p>
                  <button
                    onClick={handleNewChat}
                    className="mt-2 text-[11px] text-[#0284c7] dark:text-cyan-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <Plus className="w-3 h-3" /> Start research in Aqua
                  </button>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isChatActive = pathname === "/chat" && activeChatId === chat.id
                  return (
                    <div
                      key={chat.id}
                      onClick={() => router.push(`/chat?chatId=${chat.id}`)}
                      className={cn(
                        "group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer",
                        isChatActive
                          ? "bg-sky-50 dark:bg-sky-950/40 text-[#0284c7] dark:text-cyan-300 font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-slate-100/70 dark:hover:bg-slate-800/40 font-medium"
                      )}
                    >
                      <div className="flex items-center space-x-2 truncate min-w-0 pr-1">
                        <MessageSquare className={cn(
                          "w-3.5 h-3.5 shrink-0", 
                          isChatActive ? "text-[#0284c7] dark:text-cyan-400" : "text-slate-400 group-hover:text-[#0284c7]"
                        )} />
                        <span className="truncate">{chat.title || "Ocean Analysis"}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-slate-400 transition-opacity shrink-0 cursor-pointer"
                        title="Delete session"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* 5. Enterprise Cockpit Hardware & Telemetry Status (Bottom) */}
          <div className="p-3 border-t border-slate-200/60 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/60 pb-6 shrink-0">
            {/* Expanded Detailed Matrix */}
            <div className={cn(
              "rounded-xl bg-white dark:bg-[#071326] border border-slate-200/80 dark:border-white/10 p-3 space-y-2.5 font-mono text-xs shadow-xs transition-opacity duration-200",
              isCollapsed ? "opacity-0 pointer-events-none hidden" : "opacity-100 block"
            )}>
              <div className="flex items-center justify-between w-full">
                <div 
                  className="flex items-center gap-1.5 cursor-help"
                  title="ARGO SatCom Uplink: Operational (42ms Latency)"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                    ARGO SatCom
                  </span>
                </div>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  IRIDIUM
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 text-[10px] pt-2">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-semibold">PostgreSQL</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Synced
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-semibold">Chroma Vector</span>
                  <span className="text-[#0284c7] dark:text-cyan-400 font-bold flex items-center gap-1">
                    <Cpu className="w-2.5 h-2.5" /> Ready
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-semibold">Active Fleet</span>
                  <span className="text-foreground font-bold">
                    {fleetStats.activeFloats} Floats
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-semibold">Soundings</span>
                  <span className="text-foreground font-bold">
                    {fleetStats.totalProfiles ? `${fleetStats.totalProfiles.toLocaleString()}` : "332k"} Pts
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[9px] text-slate-400 pt-1.5">
                <span>Node: IO-IND-04</span>
                <span className="text-emerald-500 font-semibold">42ms</span>
              </div>
            </div>

            {/* Collapsed Compact Cockpit Rail (Stationary centered within 72px) */}
            <div className={cn(
              "w-[48px] flex flex-col items-center gap-2 mx-auto transition-opacity duration-200",
              isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none hidden"
            )}>
              <div 
                className="w-10 h-10 rounded-xl bg-white dark:bg-[#071326] border border-slate-200/80 dark:border-white/10 flex items-center justify-center shadow-xs cursor-help"
                title="ARGO Uplink: Synced (42ms) • Neon DB Active"
              >
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              </div>

              <div className="scale-90">
                <ThemeToggle compact />
              </div>
            </div>

          </div>

        </div>
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex animate-fade-in-up">
          <div className="w-4/5 max-w-sm h-full bg-white dark:bg-[#071326] border-r border-slate-200 dark:border-white/10 p-5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0284c7] via-[#06b6d4] to-[#38bdf8] flex items-center justify-center text-white shadow-sm">
                  <Waves className="w-4 h-4 font-bold" />
                </div>
                <span className="text-lg font-bold text-foreground">
                  Ocean<span className="text-[#0284c7]">IQ</span>
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="py-4 space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-all",
                      isActive
                        ? "bg-[#0284c7]/15 text-[#0284c7] dark:text-cyan-300 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                )
              })}
            </nav>

            <div className="flex-1 overflow-y-auto border-t border-slate-200 dark:border-white/10 pt-4">
              <p className="text-[10px] font-mono text-slate-400 uppercase mb-2">Recent Sessions</p>
              <div className="space-y-1">
                {recentChats.slice(0, 5).map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/chat?chatId=${chat.id}`}
                    onClick={() => setMobileOpen(false)}
                    className="block p-2 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 truncate"
                  >
                    {chat.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Theme</span>
                <ThemeToggle />
              </div>
              <button
                onClick={handleNewChat}
                className="w-full py-2.5 rounded-xl bg-[#0c2340] hover:bg-[#07172b] dark:bg-white dark:text-[#0c2340] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Launch Aqua AI
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Mobile Bottom Quick Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#071326]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 z-40 flex justify-around items-center px-3 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-colors duration-300">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all",
                isActive ? "text-[#0284c7] dark:text-cyan-400 font-bold" : "text-slate-600 dark:text-slate-400 hover:text-foreground"
              )}
            >
              <Icon className={cn("w-4 h-4 mb-1", isActive && "text-[#0284c7] dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]")} />
              <span className="text-[10px] tracking-tight">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
