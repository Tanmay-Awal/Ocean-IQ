"use client"

import React, { useState, useEffect, useRef } from "react"

interface CountUpProps {
  end: number
  decimals?: number
  duration?: number
  prefix?: string
  suffix?: string
  separator?: string
  className?: string
}

export function CountUp({
  end,
  decimals = 0,
  duration = 1600,
  prefix = "",
  suffix = "",
  separator = "",
  className = ""
}: CountUpProps) {
  const [displayValue, setDisplayValue] = useState<number>(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // If end is 0 or negative, set directly
    if (end === 0) {
      setDisplayValue(0)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          startAnimation()
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [end, hasAnimated])

  const startAnimation = () => {
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Quartic ease out: 1 - (1 - t)^4
      const easeOut = 1 - Math.pow(1 - progress, 4)
      const current = easeOut * end

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(end)
      }
    }

    requestAnimationFrame(animate)
  }

  // Format the number
  const formattedNumber = displayValue.toFixed(decimals)
  const formattedWithSeparator = separator
    ? formattedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    : formattedNumber

  return (
    <span ref={elementRef} className={`tabular-nums font-mono ${className}`}>
      {prefix}{formattedWithSeparator}{suffix}
    </span>
  )
}
