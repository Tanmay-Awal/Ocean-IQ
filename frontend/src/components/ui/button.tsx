import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "cyan" | "secondary" | "outline" | "ghost" | "glass" | "danger" | "link"
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm"
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            // Variants
            "bg-gradient-to-r from-ocean-cyan to-ocean-blue text-slate-950 font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:brightness-110": variant === "cyan" || variant === "default",
            "bg-surface-elevated text-slate-950 dark:text-slate-100 hover:bg-surface-hover border border-slate-300 dark:border-border hover:border-slate-400 dark:hover:border-slate-600 shadow-sm font-semibold": variant === "secondary",
            "border border-ocean-cyan/50 dark:border-ocean-cyan/40 bg-ocean-cyan/10 dark:bg-ocean-cyan/5 text-ocean-cyan dark:text-ocean-cyan hover:bg-ocean-cyan/20 hover:border-ocean-cyan shadow-sm font-semibold": variant === "outline",
            "text-slate-800 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/60 hover:text-slate-950 dark:hover:text-white font-semibold": variant === "ghost",
            "glass-panel text-slate-900 dark:text-slate-100 hover:text-ocean-cyan dark:hover:text-ocean-cyan hover:border-ocean-cyan/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold": variant === "glass",
            "bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/25 hover:border-red-500/50 hover:text-red-700 dark:hover:text-red-300 font-semibold": variant === "danger",
            "text-ocean-cyan underline-offset-4 hover:underline p-0 h-auto font-semibold": variant === "link",

            // Sizes
            "h-10 px-4 py-2": size === "default",
            "h-8 rounded-lg px-3 text-xs": size === "sm",
            "h-12 rounded-xl px-6 text-base font-semibold": size === "lg",
            "h-10 w-10 p-0 shrink-0": size === "icon",
            "h-8 w-8 rounded-lg p-0 shrink-0": size === "icon-sm",
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
