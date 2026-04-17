"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { RANK_TAG_STYLES, DEFAULT_STYLE_ID, type RankTagStyle } from "@/lib/rank-tag-config"

const FONT_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5x5-font-monospaced-0fGxzkqEby3jzE6VeuPUC7wYMuj5oZ.ttf"
const FONT_FAMILY = "RankFont"
const FONT_SHEET_URL = "/font_sheet.png"

// --- Bitmap Font Configuration ---
const FONT_MAP: { [key: string]: { x: number; y: number } } = {
  A: { x: 0, y: 0 }, B: { x: 8, y: 0 }, C: { x: 16, y: 0 }, D: { x: 24, y: 0 },
  E: { x: 32, y: 0 }, F: { x: 40, y: 0 }, G: { x: 48, y: 0 }, H: { x: 56, y: 0 },
  I: { x: 64, y: 0 }, J: { x: 72, y: 0 }, K: { x: 80, y: 0 }, L: { x: 88, y: 0 },
  M: { x: 96, y: 0 }, N: { x: 104, y: 0 }, O: { x: 112, y: 0 }, P: { x: 120, y: 0 },
  Q: { x: 0, y: 8 }, R: { x: 8, y: 8 }, S: { x: 16, y: 8 }, T: { x: 24, y: 8 },
  U: { x: 32, y: 8 }, V: { x: 40, y: 8 }, W: { x: 48, y: 8 }, X: { x: 56, y: 8 },
  Y: { x: 64, y: 8 }, Z: { x: 72, y: 8 },
}
const CHAR_WIDTH = 5
const CHAR_HEIGHT = 7

// Scale factor for internal rendering precision (render internally at higher res, display at actual size)
const SCALE = 1 // 1:1 final render size (12px high base)
// No right padding — let the right tile render fully
const RIGHT_SAFE_PAD = 0

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

// Apply a subtle 45° diagonal (top-left → bottom-right) shading overlay to simulate Minecraft UI depth.
// Final pass — run after background + text are both drawn.
function applyDiagonalShading(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  intensity = 0.15
) {
  const img = ctx.getImageData(x, y, w, h)
  const data = img.data
  const denom = w + h
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const i = (py * w + px) * 4
      if (data[i + 3] === 0) continue // skip fully transparent
      // Diagonal factor: 0 at top-left, 1 at bottom-right
      const factor = (px + py) / denom
      const shade = 1 - factor * intensity
      data[i] = Math.round(data[i] * shade)
      data[i + 1] = Math.round(data[i + 1] * shade)
      data[i + 2] = Math.round(data[i + 2] * shade)
    }
  }
  ctx.putImageData(img, x, y)
}

// Load an image with crossOrigin=anonymous for canvas access
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // Only set crossOrigin for remote URLs, not local ones
    if (url.startsWith("http")) {
      img.crossOrigin = "anonymous"
    }
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

// Cache for loaded images
const imgCache: Record<string, HTMLImageElement> = {}

async function getCachedImage(url: string): Promise<HTMLImageElement> {
  if (imgCache[url]) return imgCache[url]
  const img = await loadImage(url)
  imgCache[url] = img
  return img
}

// Apply color tint via overlay blend on grayscale image data — smoother, more natural than multiply
function tintImageData(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  color: { r: number; g: number; b: number }
) {
  // Draw template first — scale to fit w×h
  ctx.drawImage(img, x, y, w, h)
  // Read back the drawn pixels for tinting
  const imageData = ctx.getImageData(x, y, w, h)
  const data = imageData.data

  // Use simple multiply blend with luminance from the template so darker template pixels
  // yield darker shades of the chosen color, and lighter template pixels yield brighter
  // (but tinted) pixels. This works well with grayscale template images.
  for (let i = 0; i < data.length; i += 4) {
    // compute luminance from RGB channels (template may have subtle variations)
    const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255

    // Multiply blend: final = color * lum
    data[i] = Math.round(color.r * lum)
    data[i + 1] = Math.round(color.g * lum)
    data[i + 2] = Math.round(color.b * lum)
    // keep alpha as-is
  }
  // Write back the tinted pixels
  ctx.putImageData(imageData, x, y)
}

export default function RankTagGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)

  const [text, setText] = useState("ADMIN")
  const [color, setColor] = useState("#fbbf24")
  const [styleId, setStyleId] = useState(DEFAULT_STYLE_ID)
  const [fontLoaded, setFontLoaded] = useState(false)
  const [fontSheet, setFontSheet] = useState<HTMLImageElement | null>(null)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const currentStyle = RANK_TAG_STYLES.find((s) => s.id === styleId) ?? RANK_TAG_STYLES[0]

  // Load Iconify script for icons (iconify.design)
  useEffect(() => {
    if (typeof window === "undefined") return
    if ((window as any).Iconify) return
    const s = document.createElement("script")
    s.src = "https://code.iconify.design/2/2.2.1/iconify.min.js"
    s.async = true
    document.head.appendChild(s)
    return () => { document.head.removeChild(s) }
  }, [])

  // Load custom font
  useEffect(() => {
    const fontFace = new FontFace(FONT_FAMILY, `url(${FONT_URL})`)
    fontFace.load().then((loaded) => {
      document.fonts.add(loaded)
      setFontLoaded(true)
    }).catch(() => {
      setFontLoaded(true) // fallback: proceed anyway
    })

    // Load the bitmap font sheet
    loadImage(FONT_SHEET_URL).then(setFontSheet)
  }, [])

  // Preload images for current style
  useEffect(() => {
    setImagesLoaded(false)
    Promise.all([
      getCachedImage(currentStyle.leftUrl),
      getCachedImage(currentStyle.middleUrl),
      getCachedImage(currentStyle.rightUrl),
    ]).then(() => setImagesLoaded(true))
  }, [currentStyle])

  // Main render function — called on every change, runs synchronously on offscreen canvas
  const renderTag = useCallback(async () => {
    if (!fontLoaded || !imagesLoaded || !fontSheet) return
    if (!canvasRef.current) return

    const style = currentStyle
    const rgb = hexToRgb(color)
    const displayText = text || " "

    // --- 1. Calculate exact integer dimensions for the offscreen canvas ---
    const tileH = style.tileHeight
    const leftW = style.leftWidth
    const rightW = style.rightWidth
    const midW = style.middleWidth
    const charCount = displayText.length
    // The total width is the sum of all its parts, with no rounding and no extra padding.
    const totalW = leftW + midW * charCount + rightW

    // --- 2. Create or reuse offscreen canvas at native, unscaled resolution ---
    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement("canvas")
    }
    const off = offscreenRef.current
    off.width = totalW
    off.height = tileH

    const ctx = off.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Disable ALL smoothing for pixel-perfect rendering.
    ctx.imageSmoothingEnabled = false

    ctx.clearRect(0, 0, totalW, tileH)

    // Get cached images
    const [leftImg, midImg, rightImg] = await Promise.all([
      getCachedImage(style.leftUrl),
      getCachedImage(style.middleUrl),
      getCachedImage(style.rightUrl),
    ])

    // --- 3. Render the tag piece by piece, with correct layering ---

    // === LAYER 1: Background Tiles (No Overlap) ===
    // Left tile
    tintImageData(ctx, leftImg, 0, 0, leftW, tileH, rgb)

    // Middle tiles
    for (let i = 0; i < charCount; i++) {
      const x = leftW + i * midW
      tintImageData(ctx, midImg, x, 0, midW, tileH, rgb)
    }

    // Right tile
    const rightX = leftW + charCount * midW
    tintImageData(ctx, rightImg, rightX, 0, rightW, tileH, rgb)

    // === LAYER 2 & 3: Text with Shadow (from Bitmap Font) ===
    for (let i = 0; i < charCount; i++) {
      const ch = displayText[i]
      const fontChar = FONT_MAP[ch]
      if (!fontChar) continue // Skip if character not in font map

      // Center of each middle tile
      const cx = leftW + i * midW + Math.floor((midW - CHAR_WIDTH) / 2)
      // The vertical position to center the 7px font inside the 9px height tile
      const textY = Math.floor((tileH - CHAR_HEIGHT) / 2)

      // Create a temporary canvas for the shadow
      const shadowCtx = document.createElement('canvas').getContext('2d')!
      shadowCtx.canvas.width = CHAR_WIDTH
      shadowCtx.canvas.height = CHAR_HEIGHT
      shadowCtx.drawImage(fontSheet, fontChar.x, fontChar.y, CHAR_WIDTH, CHAR_HEIGHT, 0, 0, CHAR_WIDTH, CHAR_HEIGHT)
      shadowCtx.globalCompositeOperation = 'source-in'
      shadowCtx.fillStyle = 'rgba(0,0,0,0.55)'
      shadowCtx.fillRect(0, 0, CHAR_WIDTH, CHAR_HEIGHT)

      // Draw shadow
      ctx.drawImage(shadowCtx.canvas, cx + 2, textY)

      // Draw main glyph
      ctx.drawImage(fontSheet, fontChar.x, fontChar.y, CHAR_WIDTH, CHAR_HEIGHT, cx + 1, textY, CHAR_WIDTH, CHAR_HEIGHT)
    }

    // --- 4. Scale the small offscreen canvas up to the large display canvas ---
    const display = canvasRef.current
    const displayScale = 12 // Fixed integer scale for a large, crisp preview
    const displayW = totalW * displayScale
    const displayH = tileH * displayScale

    // Set the actual size of the canvas element
    display.width = displayW
    display.height = displayH

    // The CSS size can be different if needed, but for 1:1 pixel mapping, it should match
    display.style.width = `${displayW}px`
    display.style.height = `${displayH}px`

    const dCtx = display.getContext("2d")
    if (!dCtx) return

    // Ensure the display canvas also uses nearest-neighbor
    dCtx.imageSmoothingEnabled = false
    dCtx.drawImage(
      off, // The small, complete offscreen canvas
      0,
      0,
      displayW, // Scale it up to the full size of the display canvas
      displayH
    )
  }, [text, color, styleId, fontLoaded, imagesLoaded, fontSheet, currentStyle])

  useEffect(() => {
    renderTag()
  }, [renderTag])

  async function handleDownload() {
    setDownloading(true)
    await renderTag()

    // Build final full-res PNG from offscreen
    const off = offscreenRef.current
    if (!off) { setDownloading(false); return }

    const link = document.createElement("a")
    link.download = `${text || "rank"}.png`
    link.href = off.toDataURL("image/png")
    link.click()
    setDownloading(false)
  }

  function generateJsonSnippet() {
    const safeName = (text || "rank").toLowerCase().replace(/\s+/g, "_")
    return JSON.stringify(
      {
        type: "bitmap",
        file: `minecraft:font/${safeName}.png`,
        ascent: 8,
        height: 9,
        chars: ["UNIQUE-CHARACTER-HERE"],
      },
      null,
      2
    )
  }

  async function handleCopySnippet() {
    await navigator.clipboard.writeText(generateJsonSnippet())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#e8eaf0] tracking-tight">Rank Tag Generator</h1>
        <p className="text-sm text-[#7a869a] mt-1">Customize your rank tag in real-time and export as PNG.</p>
      </div>

      {/* Controls card */}
      <div className="glass rounded-2xl p-6 flex flex-col gap-5">
        {/* Row 1: Text + Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider">Rank Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => {
                // Only allow standard A-Z alphabet, uppercase, limit length
                const filtered = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 20)
                setText(filtered)
              }}
              placeholder="ADMIN"
              className="px-4 py-2.5 rounded-xl bg-[#1e1706] border border-[rgba(120,80,10,0.12)] text-[#fff8e1]
                placeholder-[#6b4f1a] text-sm focus:outline-none focus:border-[#f59e0b] focus:ring-1
                focus:ring-[rgba(245,158,11,0.14)] transition-all"
              maxLength={20}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#7a869a] uppercase tracking-wider">Template Style</label>
      <select
              value={styleId}
              onChange={(e) => setStyleId(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[#1e2435] border border-[rgba(99,120,180,0.2)] text-[#e8eaf0]
        text-sm focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[rgba(245,158,11,0.14)]
                transition-all appearance-none cursor-pointer"
            >
              {RANK_TAG_STYLES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Color picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#7a869a] uppercase tracking-wider">Background Tint Color</label>
            <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-[rgba(99,120,180,0.2)] bg-transparent p-0.5"
                title="Pick a color"
              />
            </div>
            <input
              type="text"
              value={color}
              onChange={(e) => {
                const val = e.target.value
                if (/^#[0-9a-fA-F]{0,6}$/.test(val)) setColor(val)
              }}
                className="px-3 py-2 rounded-lg bg-[#1e1706] border border-[rgba(120,80,10,0.12)] text-[#fff8e1]
                  font-mono text-sm w-32 focus:outline-none focus:border-[#f59e0b] transition-all"
              maxLength={7}
            />
            {/* Preset swatches */}
            <div className="flex items-center gap-2 flex-wrap">
              {["#f59e0b", "#fbbf24", "#fde68a", "#f97316", "#fff7ed"].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  title={c}
                  className={`w-7 h-7 rounded-lg border-2 transition-all ${
                    color === c ? "border-white scale-110" : "border-transparent hover:border-[rgba(255,255,255,0.3)]"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="h-px bg-[rgba(99,120,180,0.15)]" />

        {/* Preview area */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-[#7a869a] uppercase tracking-wider">Live Preview</label>
          <div className="flex items-center justify-center rounded-xl bg-[#0e1117] border border-[rgba(99,120,180,0.12)] min-h-[100px] py-8">
            {!fontLoaded || !imagesLoaded ? (
              <div className="flex items-center gap-2 text-[#e6d8a3] text-sm">
                <span className="iconify w-4 h-4 animate-spin text-[#fbbf24]" data-icon="mdi:loading" />
                Loading assets…
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="rounded-sm"
                style={{ imageRendering: "pixelated" }}
              />
            )}
          </div>
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={downloading || !fontLoaded || !imagesLoaded}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-black
            bg-[#fbbf24] hover:bg-[#ffd454] disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150 shadow-[0_6px_18px_rgba(245,158,11,0.22)] active:scale-[0.98]"
        >
          <span className="iconify w-4 h-4" data-icon="mdi:download" />
          {downloading ? "Exporting…" : "Download PNG"}
        </button>
      </div>

      {/* Resource Pack JSON Snippet */}
      <div className="glass rounded-2xl p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#7a869a] uppercase tracking-wider">Resource Pack JSON Snippet</label>
          <button
            onClick={handleCopySnippet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
              text-[#e6d8a3] hover:text-[#000000] hover:bg-[rgba(245,158,11,0.08)] border border-[rgba(120,80,10,0.08)]"
          >
            {copied ? (
              <>
                <span className="iconify w-3.5 h-3.5 text-[#22c55e]" data-icon="mdi:check" />
                Copied!
              </>
            ) : (
              <>
                <span className="iconify w-3.5 h-3.5" data-icon="mdi:content-copy" />
                Copy Snippet
              </>
            )}
          </button>
        </div>
        <pre className="rounded-xl bg-[#0a0d13] border border-[rgba(99,120,180,0.12)] p-4 text-xs font-mono text-[#7a869a] overflow-x-auto leading-relaxed">
          {generateJsonSnippet()}
        </pre>
      </div>
    </div>
  )
}
