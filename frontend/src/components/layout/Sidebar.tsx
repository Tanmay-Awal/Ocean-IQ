"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, MessageSquare, Activity, Map, Settings, Waves, MessageCircle, Database } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRecentChats } from "@/lib/chatStore"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "AI Chat", href: "/chat", icon: MessageSquare },
  { name: "Explore & Export", href: "/explore", icon: Database },
]

export function Sidebar() {
  const pathname = usePathname()
  const recentChats = useRecentChats()

  return (
    <>
      <aside className="hidden md:flex w-64 glass-panel border-r border-y-0 border-l-0 flex-col h-screen sticky top-0 z-40">
        <Link href="/" className="p-6 flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ocean-cyan to-ocean-blue flex items-center justify-center">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-ocean-cyan">
            Ocean-IQ
          </span>
        </Link>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                  isActive 
                    ? "bg-ocean-blue/20 text-ocean-cyan border border-ocean-blue/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]" 
                    : "text-slate-400 hover:text-white hover:bg-ocean-dark/50"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-ocean-cyan" : "text-slate-500 group-hover:text-ocean-cyan/70")} />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {recentChats.length > 0 && (
          <div className="flex-1 px-4 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-slate-800">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">Recent Queries</h3>
            <div className="space-y-1">
              {recentChats.map(chat => {
                const isChatActive = pathname === "/chat" && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("chatId") === chat.id;
                
                return (
                  <Link
                    key={chat.id}
                    href={`/chat?chatId=${chat.id}`}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer group",
                      isChatActive
                        ? "bg-ocean-blue/10 text-ocean-cyan border border-ocean-blue/20"
                        : "text-slate-400 hover:text-white hover:bg-ocean-dark/40 border border-transparent"
                    )}
                  >
                    <MessageCircle className={cn("w-3.5 h-3.5 shrink-0", isChatActive ? "text-ocean-cyan" : "text-slate-500 group-hover:text-ocean-cyan/70")} />
                    <span className="text-xs font-medium truncate">{chat.title}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#050505]/90 backdrop-blur-lg border-t border-slate-800 z-50 flex justify-around items-center px-2 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-all w-20",
                isActive ? "text-ocean-cyan" : "text-slate-400 hover:text-white"
              )}
            >
              <Icon className={cn("w-5 h-5 mb-1", isActive && "text-ocean-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]")} />
              <span className="text-[10px] font-medium text-center leading-none">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
