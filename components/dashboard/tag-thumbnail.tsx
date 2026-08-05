"use client"

import { useEffect, useRef, useState } from "react"
import { RANK_TAG_STYLES } from "@/lib/rank-tag-config"
import { FONT_SHEET_URL, loadImage, renderRankTag } from "@/lib/rank-tag-render"
import type { TagConfiguration } from "@/lib/tag-config-types"

let fontSheetPromise: Promise<HTMLImageElement> | null = null
function getFontSheet(): Promise<HTMLImageElement> {
  if (!fontSheetPromise) fontSheetPromise = loadImage(FONT_SHEET_URL)
  return fontSheetPromise
}

interface TagThumbnailProps {
  config: TagConfiguration
  scale?: number
  className?: string
}

/** Renders a small live preview of a saved tag configuration onto a canvas. Font/style assets are cached across instances. */
export default function TagThumbnail({ config, scale = 4, className }: TagThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setReady(false)

    async function render() {
      const style = RANK_TAG_STYLES.find((s) => s.id === config.styleId) ?? RANK_TAG_STYLES[0]
      const fontSheet = await getFontSheet()
      if (cancelled) return

      const offscreen = document.createElement("canvas")
      await renderRankTag(offscreen, { config, style, fontSheet, iconSheet: null })
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
      setReady(true)
    }

    render().catch(() => setReady(false))
    return () => {
      cancelled = true
    }
  }, [config, scale])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ imageRendering: "pixelated", opacity: ready ? 1 : 0, transition: "opacity 150ms" }}
    />
  )
}
