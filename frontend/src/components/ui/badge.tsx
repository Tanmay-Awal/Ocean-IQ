import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "active" | "standby" | "cyan" | "temp" | "sal" | "mld" | "outline"
  dot?: boolean
}

function Badge({ className, variant = "default", dot = false, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide transition-colors",
        {
          "bg-ocean-cyan/15 border border-ocean-cyan/30 text-ocean-cyan dark:text-ocean-aqua font-semibold": variant === "cyan" || variant === "default",
          "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold": variant === "active",
          "bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-800 dark:text-slate-300 font-medium": variant === "standby",
          "bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold": variant === "temp",
          "bg-sky-500/15 border border-sky-500/30 text-sky-600 dark:text-sky-300 font-semibold": variant === "sal",
          "bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-300 font-semibold": variant === "mld",
          "border border-slate-300 dark:border-border text-slate-800 dark:text-slate-300 bg-surface-card/80 font-medium": variant === "outline",
        },
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {variant === "active" && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", {
            "bg-emerald-400": variant === "active",
            "bg-ocean-cyan": variant === "cyan" || variant === "default",
            "bg-slate-500": variant === "standby",
            "bg-rose-400": variant === "temp",
            "bg-sky-400": variant === "sal",
            "bg-purple-400": variant === "mld",
            "bg-slate-400": variant === "outline",
          })} />
        </span>
      )}
      {children}
    </div>
  )
}

export { Badge }
