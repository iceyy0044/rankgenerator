"use client"

import { useEffect, useRef, useState } from "react"
import { renderRankTag } from "@/lib/rank-tag-render"
import type { RankTagStyle } from "@/lib/rank-tag-config"
import type { TagConfiguration } from "@/lib/tag-config-types"

interface TrueSizePreviewProps {
  config: TagConfiguration
  style: RankTagStyle
  fontSheet: HTMLImageElement
  iconSheet: HTMLImageElement | null
}

const SCALES = [1, 2, 3, 4] as const

type BackgroundTheme = "checkerboard" | "dark-chat" | "light" | "dark"

const BACKGROUNDS: { id: BackgroundTheme; label: string; style: React.CSSProperties }[] = [
  {
    id: "checkerboard",
    label: "Transparent",
    style: {
      backgroundImage:
        "linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)",
      backgroundSize: "16px 16px",
      backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
      backgroundColor: "#c0c0c0",
    },
  },
  {
    id: "dark-chat",
    label: "Minecraft chat",
    style: { backgroundColor: "rgba(0,0,0,0.5)" },
  },
  { id: "light", label: "Light", style: { backgroundColor: "#e8e8e8" } },
  { id: "dark", label: "Dark", style: { backgroundColor: "#1a1a1a" } },
]

/** Renders the tag at literal in-game pixel scale (1x-4x, matching Minecraft's GUI scale options) against selectable backgrounds, for readability checks. */
export default function TrueSizePreview({ config, style, fontSheet, iconSheet }: TrueSizePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scale, setScale] = useState<(typeof SCALES)[number]>(2)
  const [background, setBackground] = useState<BackgroundTheme>("dark-chat")

  useEffect(() => {
    let cancelled = false
    async function render() {
      const offscreen = document.createElement("canvas")
      await renderRankTag(offscreen, { config, style, fontSheet, iconSheet })
      if (cancelled) return

      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = offscreen.width * scale
      canvas.height = offscreen.height * scale
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height)
    }
    render()
    return () => {
      cancelled = true
    }
  }, [config, style, fontSheet, iconSheet, scale])

  const activeBackground = BACKGROUNDS.find((b) => b.id === background) ?? BACKGROUNDS[0]

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div
        className="w-full flex items-center justify-center rounded-xl border border-[var(--app-border)] py-8 px-4 overflow-auto min-h-[7rem]"
        style={activeBackground.style}
      >
        <canvas ref={canvasRef} style={{ imageRendering: "pixelated" }} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--app-input-bg)] border border-[var(--app-border)]">
          {SCALES.map((s) => (
            <button
              key={s}
              onClick={() => setScale(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                scale === s
                  ? "bg-[var(--app-brand)] text-black"
                  : "text-[var(--app-text)] hover:bg-[var(--app-surface-2)]"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--app-input-bg)] border border-[var(--app-border)]">
          {BACKGROUNDS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBackground(b.id)}
              title={b.label}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                background === b.id
                  ? "bg-[var(--app-brand)] text-black"
                  : "text-[var(--app-text)] hover:bg-[var(--app-surface-2)]"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
