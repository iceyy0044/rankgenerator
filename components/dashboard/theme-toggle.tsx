"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Icon } from "@iconify/react"

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="h-9 w-9 shrink-0" aria-hidden />
  }

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--app-text)] transition-colors hover:bg-[var(--app-nav-hover-bg)]"
    >
      <Icon icon={isDark ? "mdi:weather-sunny" : "mdi:weather-night"} className="h-5 w-5" />
    </button>
  )
}
