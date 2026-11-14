"use client"

import { Sidebar } from "./Sidebar"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Sparkles, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const pageTitles: Record<string, { title: string; subtitle: string; category: string }> = {
    "/dashboard": { 
      category: "TELEMETRY & FLEET",
      title: "Ocean Telemetry Dashboard", 
      subtitle: "Autonomous ARGO profiling float analytics & 3D bathymetry" 
    },
    "/explore": { 
      category: "ANALYTICS & MATRIX",
      title: "Dataset Explorer & Export Matrix", 
      subtitle: "Multi-float comparative statistics & high-density CSV export" 
    },
    "/chat": { 
      category: "AI INTELLIGENCE",
      title: "Aqua Research Assistant", 
      subtitle: "Dual-model conversational oceanographic intelligence & RAG" 
    }
  }

  const currentMeta = pageTitles[pathname] || {
    category: "OCEANIQ PLATFORM",
    title: "Oceanographic Intelligence",
    subtitle: "Real-time physical oceanography analytics platform"
  }

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row bg-[#f8fafc] dark:bg-[#030712] text-[#0c2340] dark:text-slate-100 antialiased selection:bg-[#0284c7]/20 selection:text-[#0284c7] transition-colors duration-300">
      
      {/* Subtle Atmospheric Ocean Radial Glows in the Background */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(2,132,199,0.08),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(6,182,212,0.12),transparent)]" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] pointer-events-none z-0 bg-[radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.05),transparent)] dark:bg-[radial-gradient(circle_at_bottom_right,rgba(2,132,199,0.08),transparent)]" />

      {/* Main Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden relative z-10">
        
        {/* Executive Glass Header Bar */}
        <header className="hidden md:flex h-18 border-b border-slate-200/60 dark:border-white/10 px-8 items-center justify-between sticky top-0 z-30 bg-white/70 dark:bg-[#071326]/75 backdrop-blur-2xl shadow-[0_4px_20px_rgba(2,132,199,0.03)] transition-colors duration-300">
          
          {/* Left Title & Breadcrumbs */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#0284c7] dark:hover:text-cyan-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-white/10 transition-all cursor-pointer"
              title="Return to Landing Page"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Landing</span>
            </Link>

            <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700" />

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-semibold tracking-wider uppercase text-[#0284c7] dark:text-cyan-400">
                  {currentMeta.category}
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <h2 className="text-sm font-bold text-[#0c2340] dark:text-white tracking-tight">
                  {currentMeta.title}
                </h2>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-4">
            {/* Quick Ask Button */}
            {pathname !== "/chat" && (
              <Button
                size="sm"
                onClick={() => router.push("/chat")}
                className="gap-2 text-xs rounded-full bg-[#0c2340] hover:bg-[#07172b] dark:bg-white dark:text-[#0c2340] dark:hover:bg-slate-100 text-white font-medium shadow-md shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300 dark:text-[#0284c7]" />
                <span>Ask Aqua AI</span>
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
