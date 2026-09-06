"use client"

import { useState, useEffect } from "react"
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
  ChevronRight,
  Menu,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRecentChats, chatStore } from "@/lib/chatStore"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ThemeToggle"

const navItems = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: LayoutDashboard,
    badge: "Live",
    description: "Fleet metrics & 3D globe" 
  },
  { 
    name: "Aqua Assistant", 
    href: "/chat", 
    icon: MessageSquare,
    badge: "AI",
    description: "Conversational ocean science" 
  },
  { 
    name: "Explore & Export", 
    href: "/explore", 
    icon: Database,
    badge: "Matrix",
    description: "Comparison & CSV exports" 
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const recentChats = useRecentChats()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [fleetStats, setFleetStats] = useState<{ activeFloats: number | null; totalProfiles: number | null }>({
    activeFloats: null,
    totalProfiles: null
  })

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    fetch(`${apiUrl}/api/dashboard/stats`)
      .then(res => res.json())
      .then(data => {
        if (data && data.stats) {
          setFleetStats({
            activeFloats: data.stats.totalFloats ?? 0,
            totalProfiles: data.stats.cachedProfiles ?? 0
          })
        }
      })
      .catch(() => {
        // Leave null if offline
      })
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

  return (
    <>
      {/* Mobile Top App Bar */}
      <div className="md:hidden sticky top-0 left-0 right-0 h-14 bg-surface-base/95 backdrop-blur-xl border-b border-border z-40 px-4 flex items-center justify-between transition-colors duration-300">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-ocean-cyan to-ocean-blue flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            <Waves className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            Ocean<span className="text-ocean-cyan">IQ</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <Badge variant="active" dot className="text-[10px]">Live</Badge>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-9 h-9 rounded-lg border border-border bg-surface-card flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-foreground"
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-68 glass-panel border-r border-y-0 border-l-0 flex-col h-screen sticky top-0 z-40 bg-surface-base/90 transition-colors duration-300">
        
        {/* Brand Header */}
        <div className="p-5 border-b border-border/40">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ocean-cyan via-ocean-aqua to-ocean-blue flex items-center justify-center shadow-[0_0_18px_rgba(6,182,212,0.35)] group-hover:scale-105 transition-transform duration-300">
              <Waves className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-foreground">
                  Ocean<span className="text-ocean-cyan">IQ</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-ocean-cyan/15 text-ocean-cyan border border-ocean-cyan/30">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                Indian Ocean Basin
              </p>
            </div>
          </Link>
        </div>

        {/* Primary Navigation */}
        <div className="px-3 py-4">
          <p className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">
            Intelligence Modules
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-semibold",
                    isActive 
                      ? "bg-ocean-cyan/15 text-ocean-cyan dark:text-white border border-ocean-cyan/30 shadow-[0_0_15px_rgba(6,182,212,0.12)] font-bold" 
                      : "text-slate-800 dark:text-slate-400 hover:text-foreground hover:bg-surface-hover/70"
                  )}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-ocean-cyan" : "text-slate-500 group-hover:text-ocean-cyan/80")} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-mono shrink-0 transition-all",
                    isActive ? "bg-ocean-cyan/20 text-ocean-cyan font-bold" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-400"
                  )}>
                    {item.badge}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Recent Research Sessions */}
        <div className="flex-1 px-3 overflow-y-auto mb-2 flex flex-col min-h-0 border-t border-border/30 pt-3">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-500 uppercase tracking-wider">
              Research Sessions
            </span>
            <button
              onClick={handleNewChat}
              className="p-1 rounded hover:bg-surface-hover text-slate-500 hover:text-ocean-cyan transition-colors cursor-pointer"
              title="New Research Query"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 overflow-y-auto flex-1 pr-1">
            {recentChats.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-surface-card/60 border border-border/40 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <p>No stored queries</p>
                <button
                  onClick={handleNewChat}
                  className="mt-2 text-[11px] text-ocean-cyan hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Plus className="w-3 h-3" /> Start research in Aqua
                </button>
              </div>
            ) : (
              recentChats.map((chat) => {
                const isChatActive = pathname === "/chat" && activeChatId === chat.id
                return (
                  <div
                    key={chat.id}
                    onClick={() => router.push(`/chat?chatId=${chat.id}`)}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer border",
                      isChatActive
                        ? "bg-ocean-blue/15 text-ocean-cyan dark:text-white border-ocean-cyan/30 shadow-[0_0_10px_rgba(6,182,212,0.1)] font-bold"
                        : "text-slate-800 dark:text-slate-400 hover:text-foreground hover:bg-surface-hover/50 border-transparent font-semibold"
                    )}
                  >
                    <div className="flex items-center space-x-2 truncate min-w-0 pr-1">
                      <MessageSquare className={cn("w-3.5 h-3.5 shrink-0", isChatActive ? "text-ocean-cyan" : "text-slate-500 group-hover:text-ocean-cyan/70")} />
                      <span className="truncate font-semibold">{chat.title || "Ocean Analysis"}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-slate-400 transition-opacity shrink-0 cursor-pointer"
                      title="Delete query"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Telemetry Status Footer */}
        <div className="p-3 border-t border-border/40 bg-surface-card/50">
          <div className="rounded-xl p-3 bg-surface-elevated/70 border border-border/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-slate-800 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <Radio className={cn("w-3 h-3", fleetStats.activeFloats !== null ? "text-emerald-500" : "text-slate-400")} /> ARGO Uplink
              </span>
              <Badge 
                variant={fleetStats.activeFloats !== null ? "active" : "standby"} 
                dot 
                className="text-[9px] px-1.5 py-0"
              >
                {fleetStats.activeFloats !== null ? "SYNCED" : "STANDBY"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] font-mono mt-2 pt-2 border-t border-border/30">
              <div>
                <p className="text-[9px] text-slate-700 dark:text-slate-400 uppercase font-semibold">Float Fleet</p>
                <p className="text-foreground font-bold">
                  {fleetStats.activeFloats !== null ? `${fleetStats.activeFloats} Active` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-slate-700 dark:text-slate-400 uppercase font-semibold">Profiles</p>
                <p className="text-ocean-cyan font-bold">
                  {fleetStats.totalProfiles !== null ? `${fleetStats.totalProfiles.toLocaleString()} Indexed` : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex animate-fade-in-up">
          <div className="w-4/5 max-w-sm h-full bg-surface-base border-r border-border p-5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-ocean-cyan to-ocean-blue flex items-center justify-center">
                  <Waves className="w-4 h-4 text-slate-950 font-bold" />
                </div>
                <span className="text-lg font-bold text-foreground">
                  Ocean<span className="text-ocean-cyan">IQ</span>
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-hover text-slate-500"
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
                      "flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-ocean-cyan/20 text-ocean-cyan border border-ocean-cyan/30"
                        : "text-slate-700 dark:text-slate-300 hover:bg-surface-hover"
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

            <div className="flex-1 overflow-y-auto border-t border-border pt-4">
              <p className="text-[10px] font-mono text-slate-400 uppercase mb-2">Recent Sessions</p>
              <div className="space-y-1">
                {recentChats.slice(0, 5).map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/chat?chatId=${chat.id}`}
                    onClick={() => setMobileOpen(false)}
                    className="block p-2 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-surface-hover truncate"
                  >
                    {chat.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-2">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Theme</span>
                <ThemeToggle />
              </div>
              <button
                onClick={handleNewChat}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-ocean-cyan to-ocean-blue text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:brightness-105 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Launch Aqua AI
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Mobile Bottom Quick Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-base/95 backdrop-blur-xl border-t border-border z-40 flex justify-around items-center px-3 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-colors duration-300">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all",
                isActive ? "text-ocean-cyan font-bold" : "text-slate-600 dark:text-slate-400 hover:text-foreground"
              )}
            >
              <Icon className={cn("w-4 h-4 mb-1", isActive && "text-ocean-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]")} />
              <span className="text-[10px] tracking-tight">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
