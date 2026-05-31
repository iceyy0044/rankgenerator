"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { RANK_TAG_STYLES, DEFAULT_STYLE_ID } from "@/lib/rank-tag-config"
import { FONT_SHEET_URL, getCachedImage, loadImage, renderRankTag } from "@/lib/rank-tag-render"
import type { TagConfiguration } from "@/lib/tag-config-types"
import { ICON_OPTIONS, ICON_SHEET_URL } from "@/lib/icon-sheet-config"
import TagSavedPanel, { saveTagToHistory } from "@/components/dashboard/tag-saved-panel"

const FONT_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5x5-font-monospaced-0fGxzkqEby3jzE6VeuPUC7wYMuj5oZ.ttf"
const FONT_FAMILY = "RankFont"

type ProductBanner = {
  id: string
  title: string
  href: string
  imageUrl: string
}

const BBB_PRODUCT_BANNERS: ProductBanner[] = [
  {
    id: "bbb-product-1",
    title: "Medieval Hud - BetterHud",
    href: "https://builtbybit.com/resources/medieval-hud-betterhud.108562/",
    imageUrl: "https://builtbybit.com/attachments/medievalhud-png.1336314/?preset=fullr1",
  },
  {
    id: "bbb-product-2",
    title: "Tavern Hud - BetterHud",
    href: "https://builtbybit.com/resources/tavern-hud-betterhud.102606/",
    imageUrl: "https://builtbybit.com/attachments/tavernbetterhud-png.1333954/?preset=fullr1",
  },
  {
    id: "bbb-product-3",
    title: "Medieval Config - ShopGUI+",
    href: "https://builtbybit.com/resources/medieval-config-shopguiplus.109127/",
    imageUrl: "https://builtbybit.com/attachments/medieval-shop-png.1341732/?preset=fullr1",
  },
  {
    id: "bbb-product-4",
    title: "Medieval Config - DeluxeMenu Rewards",
    href: "https://builtbybit.com/resources/medieval-config-rewards.107205/",
    imageUrl: "https://builtbybit.com/attachments/rewards-png.1333882/?preset=fullr1",
  },
  {
    id: "bbb-product-5",
    title: "Tavern Config - TAB Scoreboard",
    href: "https://builtbybit.com/resources/tavern-config-scoreboard.107883/",
    imageUrl: "https://builtbybit.com/attachments/tavernscoraboard-png.1333982/?preset=fullr1",
  },
  {
    id: "bbb-product-6",
    title: "Premium Fire Website Template",
    href: "https://builtbybit.com/resources/premium-fire-website-template.70302/",
    imageUrl: "https://builtbybit.com/attachments/firewebtemplate_preview_main-png.986445/?preset=fullr1",
  },
  {
    id: "bbb-product-7",
    title: "Topaz Minecraft Web Template",
    href: "https://builtbybit.com/resources/topaz-minecraft-web-template.102490/",
    imageUrl: "https://builtbybit.com/attachments/topazwebtemplate_banners-png.1284097/?preset=fullr1",
  },
  {
    id: "bbb-product-8",
    title: "Free Premium Minecraft Web Template",
    href: "https://builtbybit.com/resources/free-premium-minecraft-web-template.70116/",
    imageUrl: "https://builtbybit.com/attachments/bbb-banner-free-website-v1-png.984676/?preset=fullr1",
  },
]

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return loadImage(url)
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
  const [iconId, setIconId] = useState<string | null>(null)
  const [fontLoaded, setFontLoaded] = useState(false)
  const [fontSheet, setFontSheet] = useState<HTMLImageElement | null>(null)
  const [iconSheet, setIconSheet] = useState<HTMLImageElement | null>(null)
  const [iconSheetLoaded, setIconSheetLoaded] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)

  const currentStyle = RANK_TAG_STYLES.find((s) => s.id === styleId) ?? RANK_TAG_STYLES[0]

  const currentConfig: TagConfiguration = {
    text,
    styleId,
    colorMode,
    color,
    gradientStart,
    gradientEnd,
    gradientAngle,
    iconId,
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    if ((window as Window & { Iconify?: unknown }).Iconify) return
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

    loadImageFromUrl(FONT_SHEET_URL).then(setFontSheet)
    loadImageFromUrl(ICON_SHEET_URL)
      .then((img) => {
        setIconSheet(img)
        setIconSheetLoaded(true)
      })
      .catch(() => {
        setIconSheet(null)
        setIconSheetLoaded(true)
      })
  }, [])

  useEffect(() => {
    setImagesLoaded(false)
    Promise.all([
      getCachedImage(currentStyle.leftUrl),
      getCachedImage(currentStyle.middleUrl),
      getCachedImage(currentStyle.rightUrl),
    ]).then(() => setImagesLoaded(true))
  }, [currentStyle])

  const loadConfig = useCallback((config: TagConfiguration) => {
    setText(config.text)
    setStyleId(config.styleId)
    setColorMode(config.colorMode)
    setColor(config.color)
    setGradientStart(config.gradientStart)
    setGradientEnd(config.gradientEnd)
    setGradientAngle(config.gradientAngle)
    setIconId(config.iconId)
  }, [])

  const renderTag = useCallback(async () => {
    if (!fontLoaded || !imagesLoaded || !fontSheet || !canvasRef.current) return

    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement("canvas")
    }
    const off = offscreenRef.current

    await renderRankTag(off, {
      config: currentConfig,
      style: currentStyle,
      fontSheet,
      iconSheet,
    })

    const display = canvasRef.current
    const displayScale = 12
    const displayW = off.width * displayScale
    const displayH = off.height * displayScale

    display.width = displayW
    display.height = displayH
    display.style.width = `${displayW}px`
    display.style.height = `${displayH}px`

    const dCtx = display.getContext("2d")
    if (!dCtx) return
    dCtx.imageSmoothingEnabled = false
    dCtx.drawImage(off, 0, 0, displayW, displayH)
  }, [color, colorMode, currentConfig, currentStyle, fontLoaded, fontSheet, iconId, iconSheet, iconSheetLoaded, imagesLoaded])

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

    await saveTagToHistory(currentConfig)
    setHistoryRefreshKey((k) => k + 1)
    setDownloading(false)
  }

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        <div>
          <h1 className="text-2xl font-bold text-[#e8eaf0] tracking-tight">Sam&apos;s Ranks</h1>
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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider">Prefix Icon</label>
            <div className="relative">
              <select
                value={iconId ?? ""}
                onChange={(e) => setIconId(e.target.value || null)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1e1706] border border-[rgba(120,80,10,0.12)] text-[#e8eaf0]
                  text-sm focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[rgba(245,158,11,0.14)]
                  transition-all appearance-none cursor-pointer"
              >
                <option value="">None</option>
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon.id} value={icon.id}>
                    {icon.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                <span className="iconify text-[#7a869a]" data-icon="mdi:chevron-down" />
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

        <TagSavedPanel currentConfig={currentConfig} onLoadConfig={loadConfig} refreshKey={historyRefreshKey} />

        <div className="glass rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#e8eaf0] tracking-tight">Explore Our Other Work</h2>
            <p className="text-xs text-[#7a869a] mt-1">Look at what everything else we have created including our amazing web templates and Plugin Configurations with Custom UIs.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {BBB_PRODUCT_BANNERS.map((banner) => (
              <a
                key={banner.id}
                href={banner.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-xl border border-[rgba(120,80,10,0.2)] bg-[#0e1117]"
              >
                <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-2">
                    <p className="text-xs font-semibold text-white drop-shadow-sm">{banner.title}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        <footer className="text-center text-sm text-[#7a869a] py-4">
          Copyright {new Date().getFullYear()}© Sam&apos;s Ranks. All Rights Reserved.
        </footer>
      </div>
    </>
  )
}
