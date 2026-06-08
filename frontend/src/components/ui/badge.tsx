import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-ocean-blue text-white": variant === "default",
          "border-transparent bg-ocean-dark text-ocean-cyan": variant === "secondary",
          "border-ocean-blue text-ocean-blue": variant === "outline",
          "border-transparent bg-emerald-500/20 text-emerald-400": variant === "success",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
