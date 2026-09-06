import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative flex items-center w-full">
          <div className="absolute left-3.5 text-slate-500 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-xl border border-border bg-surface-card/70 pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-slate-500 transition-all focus-visible:outline-none focus-visible:border-ocean-cyan/60 focus-visible:ring-2 focus-visible:ring-ocean-cyan/20 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-border bg-surface-card/70 px-4 py-2 text-sm text-foreground placeholder:text-slate-500 transition-all focus-visible:outline-none focus-visible:border-ocean-cyan/60 focus-visible:ring-2 focus-visible:ring-ocean-cyan/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
