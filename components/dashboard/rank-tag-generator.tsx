"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { RANK_TAG_STYLES, DEFAULT_STYLE_ID } from "@/lib/rank-tag-config"

const FONT_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5x5-font-monospaced-0fGxzkqEby3jzE6VeuPUC7wYMuj5oZ.ttf"
const FONT_FAMILY = "RankFont"
const FONT_SHEET_URL = "/font_sheet.png"

const FONT_MAP: { [key: string]: { x: number; y: number } } = {
  A: { x: 0, y: 0 },
  B: { x: 8, y: 0 },
  C: { x: 16, y: 0 },
  D: { x: 24, y: 0 },
  E: { x: 32, y: 0 },
  F: { x: 40, y: 0 },
  G: { x: 48, y: 0 },
  H: { x: 56, y: 0 },
  I: { x: 64, y: 0 },
  J: { x: 72, y: 0 },
  K: { x: 80, y: 0 },
  L: { x: 88, y: 0 },
  M: { x: 96, y: 0 },
  N: { x: 104, y: 0 },
  O: { x: 112, y: 0 },
  P: { x: 120, y: 0 },
  Q: { x: 0, y: 8 },
  R: { x: 8, y: 8 },
  S: { x: 16, y: 8 },
  T: { x: 24, y: 8 },
  U: { x: 32, y: 8 },
  V: { x: 40, y: 8 },
  W: { x: 48, y: 8 },
  X: { x: 56, y: 8 },
  Y: { x: 64, y: 8 },
  Z: { x: 72, y: 8 },
  _: { x: 80, y: 8 },
  "-": { x: 88, y: 8 },
  ".": { x: 96, y: 8 },
  " ": { x: 104, y: 8 },
  "+": { x: 112, y: 8 },
  "!": { x: 120, y: 8 },
  0: { x: 0, y: 16 },
  1: { x: 8, y: 16 },
  2: { x: 16, y: 16 },
  3: { x: 24, y: 16 },
  4: { x: 32, y: 16 },
  5: { x: 40, y: 16 },
  6: { x: 48, y: 16 },
  7: { x: 56, y: 16 },
  8: { x: 64, y: 16 },
  9: { x: 72, y: 16 },
}

const CHAR_WIDTH = 5
const CHAR_HEIGHT = 7

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function applyGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  colorStart: { r: number; g: number; b: number },
  colorEnd: { r: number; g: number; b: number },
  angle: number
) {
  const centerX = x + w / 2
  const centerY = y + h / 2
  const rad = (angle * Math.PI) / 180
  const halfDiagonal = Math.sqrt(w * w + h * h) / 2
  const dx = Math.cos(rad) * halfDiagonal
  const dy = Math.sin(rad) * halfDiagonal

  // 0 = left->right, 45 = top-left->bottom-right, 90 = top->bottom
  const gradient = ctx.createLinearGradient(centerX - dx, centerY - dy, centerX + dx, centerY + dy)
  gradient.addColorStop(0, `rgb(${colorStart.r}, ${colorStart.g}, ${colorStart.b})`)
  gradient.addColorStop(1, `rgb(${colorEnd.r}, ${colorEnd.g}, ${colorEnd.b})`)

  ctx.fillStyle = gradient
  ctx.fillRect(x, y, w, h)
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (url.startsWith("http")) {
      img.crossOrigin = "anonymous"
    }
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

const imgCache: Record<string, HTMLImageElement> = {}

async function getCachedImage(url: string): Promise<HTMLImageElement> {
  if (imgCache[url]) return imgCache[url]
  const img = await loadImage(url)
  imgCache[url] = img
  return img
}

function tintImageData(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  color: { r: number; g: number; b: number }
) {
  ctx.drawImage(img, x, y, w, h)
  const imageData = ctx.getImageData(x, y, w, h)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255
    data[i] = Math.round(color.r * lum)
    data[i + 1] = Math.round(color.g * lum)
    data[i + 2] = Math.round(color.b * lum)
  }

  ctx.putImageData(imageData, x, y)
}

export default function RankTagGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)

  const [text, setText] = useState("ADMIN")
  const [colorMode, setColorMode] = useState<"solid" | "gradient">("solid")
  const [color, setColor] = useState("#fbbf24")
  const [gradientStart, setGradientStart] = useState("#0051FF")
  const [gradientEnd, setGradientEnd] = useState("#FFFFFF")
  const [gradientAngle, setGradientAngle] = useState(0)
  const [styleId, setStyleId] = useState(DEFAULT_STYLE_ID)
  const [fontLoaded, setFontLoaded] = useState(false)
  const [fontSheet, setFontSheet] = useState<HTMLImageElement | null>(null)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [snippetFormat, setSnippetFormat] = useState("vanilla")

  const currentStyle = RANK_TAG_STYLES.find((s) => s.id === styleId) ?? RANK_TAG_STYLES[0]

  useEffect(() => {
    if (typeof window === "undefined") return
    if ((window as any).Iconify) return
    const script = document.createElement("script")
    script.src = "https://code.iconify.design/2/2.2.1/iconify.min.js"
    script.async = true
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  useEffect(() => {
    const fontFace = new FontFace(FONT_FAMILY, `url(${FONT_URL})`)
    fontFace
      .load()
      .then((loaded) => {
        document.fonts.add(loaded)
        setFontLoaded(true)
      })
      .catch(() => {
        setFontLoaded(true)
      })

    loadImage(FONT_SHEET_URL).then(setFontSheet)
  }, [])

  useEffect(() => {
    setImagesLoaded(false)
    Promise.all([
      getCachedImage(currentStyle.leftUrl),
      getCachedImage(currentStyle.middleUrl),
      getCachedImage(currentStyle.rightUrl),
    ]).then(() => setImagesLoaded(true))
  }, [currentStyle])

  const renderTag = useCallback(async () => {
    if (!fontLoaded || !imagesLoaded || !fontSheet || !canvasRef.current) return

    const style = currentStyle
    const selectedRgb = hexToRgb(color)
    const startRgb = hexToRgb(gradientStart)
    const endRgb = hexToRgb(gradientEnd)
    const gradientMid = {
      r: Math.round((startRgb.r + endRgb.r) / 2),
      g: Math.round((startRgb.g + endRgb.g) / 2),
      b: Math.round((startRgb.b + endRgb.b) / 2),
    }

    const displayText = text || " "
    const tileH = style.tileHeight
    const leftW = style.leftWidth
    const rightW = style.rightWidth
    const midW = style.middleWidth
    const charCount = displayText.length
    const totalW = leftW + midW * charCount + rightW

    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement("canvas")
    }
    const off = offscreenRef.current
    off.width = totalW
    off.height = tileH

    const ctx = off.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, totalW, tileH)

    const [leftImg, midImg, rightImg] = await Promise.all([
      getCachedImage(style.leftUrl),
      getCachedImage(style.middleUrl),
      getCachedImage(style.rightUrl),
    ])

    if (colorMode === "solid") {
      tintImageData(ctx, leftImg, 0, 0, leftW, tileH, selectedRgb)
      for (let i = 0; i < charCount; i++) {
        tintImageData(ctx, midImg, leftW + i * midW, 0, midW, tileH, selectedRgb)
      }
      tintImageData(ctx, rightImg, leftW + charCount * midW, 0, rightW, tileH, selectedRgb)
    } else {
      const maskCanvas = document.createElement("canvas")
      maskCanvas.width = totalW
      maskCanvas.height = tileH
      const maskCtx = maskCanvas.getContext("2d")
      if (!maskCtx) return

      maskCtx.imageSmoothingEnabled = false
      maskCtx.drawImage(leftImg, 0, 0, leftW, tileH)
      for (let i = 0; i < charCount; i++) {
        maskCtx.drawImage(midImg, leftW + i * midW, 0, midW, tileH)
      }
      maskCtx.drawImage(rightImg, leftW + charCount * midW, 0, rightW, tileH)

      // Keep texture depth by multiplying gradient with the grayscale template.
      ctx.drawImage(maskCanvas, 0, 0)
      ctx.globalCompositeOperation = "multiply"
      applyGradient(ctx, 0, 0, totalW, tileH, startRgb, endRgb, gradientAngle)
      ctx.globalCompositeOperation = "destination-in"
      ctx.drawImage(maskCanvas, 0, 0)
      ctx.globalCompositeOperation = "source-over"
    }

    const textTintRgb = colorMode === "solid" ? selectedRgb : gradientMid

    for (let i = 0; i < charCount; i++) {
      const ch = displayText[i]
      const fontChar = FONT_MAP[ch]
      if (!fontChar) continue

      const cx = leftW + i * midW + Math.floor((midW - CHAR_WIDTH) / 2)
      const textY = Math.floor((tileH - CHAR_HEIGHT) / 2)

      const shadowCtx = document.createElement("canvas").getContext("2d")
      if (!shadowCtx) continue
      shadowCtx.canvas.width = CHAR_WIDTH
      shadowCtx.canvas.height = CHAR_HEIGHT
      shadowCtx.drawImage(fontSheet, fontChar.x, fontChar.y, CHAR_WIDTH, CHAR_HEIGHT, 0, 0, CHAR_WIDTH, CHAR_HEIGHT)
      shadowCtx.globalCompositeOperation = "source-in"
      shadowCtx.fillStyle = "rgba(0,0,0,0.55)"
      shadowCtx.fillRect(0, 0, CHAR_WIDTH, CHAR_HEIGHT)
      ctx.drawImage(shadowCtx.canvas, cx + 1, textY + 1)

      const glyphCtx = document.createElement("canvas").getContext("2d")
      if (!glyphCtx) continue
      glyphCtx.canvas.width = CHAR_WIDTH
      glyphCtx.canvas.height = CHAR_HEIGHT
      glyphCtx.drawImage(fontSheet, fontChar.x, fontChar.y, CHAR_WIDTH, CHAR_HEIGHT, 0, 0, CHAR_WIDTH, CHAR_HEIGHT)
      glyphCtx.globalCompositeOperation = "source-in"
      glyphCtx.fillStyle = "#ffffff"
      glyphCtx.fillRect(0, 0, CHAR_WIDTH, CHAR_HEIGHT)

      const baseRgb = { r: 205, g: 205, b: 205 }
      const mixedRgb = {
        r: Math.round(baseRgb.r * 0.8 + textTintRgb.r * 0.2),
        g: Math.round(baseRgb.g * 0.8 + textTintRgb.g * 0.2),
        b: Math.round(baseRgb.b * 0.8 + textTintRgb.b * 0.2),
      }
      glyphCtx.globalCompositeOperation = "source-atop"
      glyphCtx.fillStyle = `rgba(${mixedRgb.r}, ${mixedRgb.g}, ${mixedRgb.b}, 0.4)`
      glyphCtx.fillRect(0, CHAR_HEIGHT - 3, CHAR_WIDTH, 3)

      ctx.drawImage(glyphCtx.canvas, cx + 1, textY)
    }

    const display = canvasRef.current
    const displayScale = 12
    const displayW = totalW * displayScale
    const displayH = tileH * displayScale

    display.width = displayW
    display.height = displayH
    display.style.width = `${displayW}px`
    display.style.height = `${displayH}px`

    const dCtx = display.getContext("2d")
    if (!dCtx) return
    dCtx.imageSmoothingEnabled = false
    dCtx.drawImage(off, 0, 0, displayW, displayH)
  }, [
    color,
    colorMode,
    currentStyle,
    fontLoaded,
    fontSheet,
    gradientAngle,
    gradientEnd,
    gradientStart,
    imagesLoaded,
    text,
  ])

  useEffect(() => {
    renderTag()
  }, [renderTag])

  async function handleDownload() {
    setDownloading(true)
    await renderTag()

    const off = offscreenRef.current
    if (!off) {
      setDownloading(false)
      return
    }

    const link = document.createElement("a")
    link.download = `${text || "rank"}.png`
    link.href = off.toDataURL("image/png")
    link.click()
    setDownloading(false)
  }

  function generateJsonSnippet() {
    const safeName = (text || "rank").toLowerCase().replace(/\s+/g, "_")

    switch (snippetFormat) {
      case "nexo":
        return `${safeName}:
  texture: ${safeName}.png
  height: 7
  ascent: 7
  permission: sams_rank.${safeName}`
      case "itemsadder":
        return `info:
  namespace: "sams_ranks"
font_images:
  ${safeName}:
    permission: "sams_rank.${safeName}"
    show_in_gui: true
    suggest_in_command: false
    path: "${safeName}.png"
    scale_ratio: 7
    y_position: 7`
      case "vanilla":
      default:
        return JSON.stringify(
          {
            providers: [
              {
                type: "bitmap",
                file: `minecraft:font/${safeName}.png`,
                ascent: 8,
                height: 9,
                chars: ["UNIQUE-CHARACTER-HERE"],
              },
            ],
          },
          null,
          2
        )
    }
  }

  async function handleCopySnippet() {
    await navigator.clipboard.writeText(generateJsonSnippet())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        <div>
          <h1 className="text-2xl font-bold text-[#e8eaf0] tracking-tight">Sam's Ranks</h1>
          <p className="text-sm text-[#7a869a] mt-1">Customize your rank tag in real-time and export as PNG.</p>
        </div>

        <div className="glass rounded-2xl p-4 sm:p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider">Rank Text</label>
              <div className="relative">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => {
                    const filtered = e.target.value.toUpperCase().replace(/[^A-Z0-9_\/\.\- +!]/g, "").slice(0, 15)
                    setText(filtered)
                  }}
                  placeholder="ADMIN"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1e1706] border border-[rgba(120,80,10,0.12)] text-[#fff8e1]
                    placeholder-[#6b4f1a] text-sm focus:outline-none focus:border-[#f59e0b] focus:ring-1
                    focus:ring-[rgba(245,158,11,0.14)] transition-all pr-12"
                  maxLength={15}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <span className="text-xs text-[#7a869a]">{text.length}/15</span>
                </div>
              </div>
              <p className="text-xs text-[#7a869a] mt-1">
                Allowed characters: ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-.+! and a space
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider">Template Style</label>
              <div className="relative">
                <select
                  value={styleId}
                  onChange={(e) => setStyleId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1e1706] border border-[rgba(120,80,10,0.12)] text-[#e8eaf0]
                    text-sm focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[rgba(245,158,11,0.14)]
                    transition-all appearance-none cursor-pointer"
                >
                  {RANK_TAG_STYLES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                  <span className="iconify text-[#7a869a]" data-icon="mdi:chevron-down" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider">Color Mode</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setColorMode("solid")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    colorMode === "solid"
                      ? "bg-[#fbbf24] text-black"
                      : "bg-[#1e1706] text-[#e8eaf0] hover:bg-[#2a2108]"
                  }`}
                >
                  Solid
                </button>
                <button
                  onClick={() => setColorMode("gradient")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    colorMode === "gradient"
                      ? "bg-[#fbbf24] text-black"
                      : "bg-[#1e1706] text-[#e8eaf0] hover:bg-[#2a2108]"
                  }`}
                >
                  Gradient
                </button>
              </div>
            </div>

            {colorMode === "solid" ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider">Background Tint Color</label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-[rgba(120,80,10,0.12)] bg-transparent p-0.5"
                    title="Pick a color"
                  />
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
                  <div className="flex items-center gap-2 flex-wrap">
                    {["#e3e2a0", "#a1d59f", "#f7cfb1", "#DD3838", "#5E719E"].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setColor(preset)}
                        title={preset}
                        className={`w-7 h-7 rounded-lg border-2 transition-all ${
                          color === preset ? "border-white scale-110" : "border-transparent hover:border-[rgba(255,255,255,0.3)]"
                        }`}
                        style={{ backgroundColor: preset }}
                      />
                    ))}
                    <button
                      onClick={() => {
                        const randomColor = `#${Math.floor(Math.random() * 16777215)
                          .toString(16)
                          .padStart(6, "0")}`
                        setColor(randomColor)
                      }}
                      title="Random Color"
                      className="group relative w-7 h-7 rounded-lg border-2 border-transparent flex items-center justify-center
                        overflow-hidden transition-all duration-300 hover:border-yellow-400/50"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-yellow-600/20 to-yellow-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="iconify w-4 h-4 text-yellow-400/70 group-hover:text-white transition-colors duration-300 z-10" data-icon="ion:sparkles-sharp" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider">Gradient Colors</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={gradientStart}
                      onChange={(e) => setGradientStart(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-[rgba(120,80,10,0.12)] bg-transparent p-0.5"
                      title="Gradient Start Color"
                    />
                    <input
                      type="color"
                      value={gradientEnd}
                      onChange={(e) => setGradientEnd(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-[rgba(120,80,10,0.12)] bg-transparent p-0.5"
                      title="Gradient End Color"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider">Gradient Angle ({gradientAngle}deg)</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={gradientAngle}
                    onChange={(e) => setGradientAngle(Number(e.target.value))}
                    className="w-full h-2 bg-[#1e1706] rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-[rgba(120,80,10,0.15)]" />

          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider">Live Preview</label>
            <div className="flex items-center justify-center rounded-xl bg-[#0e1117] border border-[rgba(120,80,10,0.12)] min-h-[100px] p-4 sm:p-8">
              {!fontLoaded || !imagesLoaded || !fontSheet ? (
                <div className="flex items-center gap-2 text-[#e6d8a3] text-sm">
                  <span className="iconify w-4 h-4 animate-spin text-[#fbbf24]" data-icon="mdi:loading" />
                  Loading assets...
                </div>
              ) : (
                <canvas ref={canvasRef} className="rounded-sm" style={{ imageRendering: "pixelated" }} />
              )}
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading || !fontLoaded || !imagesLoaded}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-black
              bg-[#fbbf24] hover:bg-[#ffd454] disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150 shadow-[0_6px_18px_rgba(245,158,11,0.22)] active:scale-[0.98]"
          >
            <span className="iconify w-4 h-4" data-icon="mdi:download" />
            {downloading ? "Exporting..." : "Download PNG"}
          </button>
        </div>

        <div className="glass rounded-2xl p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider">
                Resource Pack JSON Snippet
              </label>
              <div className="relative w-40 mt-1">
                <select
                  value={snippetFormat}
                  onChange={(e) => setSnippetFormat(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#1e1706] border border-[rgba(120,80,10,0.12)] text-[#e8eaf0]
                    text-sm focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[rgba(245,158,11,0.14)]
                    transition-all appearance-none cursor-pointer"
                >
                  <option value="vanilla">Vanilla</option>
                  <option value="itemsadder">ItemsAdder</option>
                  <option value="nexo">Nexo</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                  <span className="iconify text-[#7a869a]" data-icon="mdi:chevron-down" />
                </div>
              </div>
            </div>
            <button
              onClick={handleCopySnippet}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                bg-[#1e1706] border border-[rgba(120,80,10,0.12)] text-[#e6d8a3] hover:bg-[#2a2108]"
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

          <pre className="rounded-xl bg-[#0a0d13] border border-[rgba(120,80,10,0.12)] p-4 text-xs font-mono text-[#7a869a] overflow-x-auto leading-relaxed">
            {generateJsonSnippet()}
          </pre>

          {snippetFormat === "itemsadder" && (
            <div className="mt-2 text-xs text-[#7a869a] bg-[#0a0d13] border border-[rgba(120,80,10,0.12)] rounded-lg p-3">
              <p className="font-semibold text-[#e8d8a8]">Place this configuration in:</p>
              <code className="block bg-black/20 px-2 py-1 rounded-md my-1">plugins/ItemsAdder/contents/[namespace]/configs/prefixes.yml</code>
              <p>Do not forget to place the exported PNG image in the appropriate textures folder.</p>
            </div>
          )}

          {snippetFormat === "nexo" && (
            <div className="mt-2 text-xs text-[#7a869a] bg-[#0a0d13] border border-[rgba(120,80,10,0.12)] rounded-lg p-3">
              <p className="font-semibold text-[#e8d8a8]">Place this configuration in:</p>
              <code className="block bg-black/20 px-2 py-1 rounded-md my-1">plugins/Nexo/glyphs/[namespace]/configs/prefixes.yml</code>
              <p>Do not forget to place the exported PNG image in the appropriate textures folder.</p>
            </div>
          )}
        </div>

        <footer className="text-center text-sm text-[#7a869a] py-4">
          Copyright {new Date().getFullYear()} Sam's Ranks. All Rights Reserved.
        </footer>
      </div>
    </>
  )
}
