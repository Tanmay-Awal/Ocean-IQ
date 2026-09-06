"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light"

interface ThemeContextType {
  theme: Theme
  isDark: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = "oceaniq_theme_mode"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    if (saved === "light" || saved === "dark") {
      setThemeState(saved)
      applyTheme(saved)
    } else {
      // Default to dark as primary scientific theme
      setThemeState("dark")
      applyTheme("dark")
    }
    setMounted(true)
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    if (newTheme === "dark") {
      root.classList.add("dark")
      root.classList.remove("light")
      root.style.colorScheme = "dark"
    } else {
      root.classList.remove("dark")
      root.classList.add("light")
      root.style.colorScheme = "light"
    }
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    applyTheme(newTheme)
  }

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === "dark", toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    // Return safe fallback for components outside provider
    return {
      theme: "dark" as Theme,
      isDark: true,
      toggleTheme: () => {},
      setTheme: () => {}
    }
  }
  return context
}
