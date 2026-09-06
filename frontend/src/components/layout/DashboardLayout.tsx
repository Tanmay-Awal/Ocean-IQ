"use client"

import { Sidebar } from "./Sidebar"
import { usePathname, useRouter } from "next/navigation"
import { Sparkles, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    "/dashboard": { 
      title: "Ocean Telemetry Dashboard", 
      subtitle: "Autonomous ARGO profiling float analytics & 3D bathymetry" 
    },
    "/explore": { 
      title: "Dataset Explorer & Export Matrix", 
      subtitle: "Multi-float comparative statistics & high-density CSV export" 
    },
    "/chat": { 
      title: "Aqua Research Assistant", 
      subtitle: "Dual-model conversational oceanographic intelligence & RAG" 
    }
  }

  const currentMeta = pageTitles[pathname] || {
    title: "Oceanographic Intelligence",
    subtitle: "Real-time physical oceanography analytics platform"
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground antialiased selection:bg-ocean-cyan/20 selection:text-ocean-cyan transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Executive Header Bar */}
        <header className="hidden md:flex h-16 border-b border-border/50 px-8 items-center justify-between glass-panel sticky top-0 z-30 bg-surface-base/80 backdrop-blur-xl transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-800 dark:text-slate-400 font-bold uppercase tracking-wider">OceanIQ Platform</span>
                <span className="text-slate-400 dark:text-slate-600">/</span>
                <h2 className="text-sm font-bold text-foreground tracking-tight">{currentMeta.title}</h2>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* System Status Indicators */}
            <div className="flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-surface-card border border-border/60 text-xs font-mono text-slate-900 dark:text-slate-300 shadow-sm font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Neon DB: Connected
              </span>
              <span className="text-slate-400 dark:text-slate-700">|</span>
              <span className="flex items-center gap-1 text-ocean-cyan font-bold">
                <Database className="w-3 h-3" />
                Chroma Vector: Ready
              </span>
            </div>

            {/* Quick Ask Button */}
            {pathname !== "/chat" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/chat")}
                className="gap-2 text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-ocean-cyan" />
                <span>Launch Aqua AI</span>
              </Button>
            )}

            {/* Theme Toggle Sun/Moon */}
            <ThemeToggle />
          </div>
        </header>

        {/* Content Container with Mobile Bottom Nav Padding */}
        <div className="flex-1 max-w-[1680px] w-full mx-auto px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-12">
          {children}
        </div>
      </main>
    </div>
  )
}
