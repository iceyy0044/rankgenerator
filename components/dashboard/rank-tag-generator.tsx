"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { RANK_TAG_STYLES, DEFAULT_STYLE_ID, getIconBackgroundUrl } from "@/lib/rank-tag-config"
import { FONT_SHEET_URL, getCachedImage, loadImage, renderRankTag } from "@/lib/rank-tag-render"
import { type TagConfiguration, MAX_TAG_TEXT_LENGTH } from "@/lib/tag-config-types"
import { ICON_OPTIONS, ICON_SHEET_URL, normalizeIconId } from "@/lib/icon-sheet-config"
import { DEFAULT_GRADIENT_COLORS } from "@/lib/gradient-utils"
import TagColorControls from "@/components/dashboard/tag-color-controls"
import SyncToggle from "@/components/dashboard/sync-toggle"
import { saveTagToHistory, saveTagToFavourites } from "@/components/dashboard/tag-saved-panel"
import { consumeStashedTagConfig } from "@/lib/tag-config-storage"
import GeneratorSection, { fieldLabelClass, inputClass, selectClass } from "@/components/dashboard/generator-section"

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
  const [gradientColors, setGradientColors] = useState<string[]>([...DEFAULT_GRADIENT_COLORS])
  const [gradientAngle, setGradientAngle] = useState(0)
  const [styleId, setStyleId] = useState(DEFAULT_STYLE_ID)
  const [iconId, setIconId] = useState<string | null>(null)
  const [iconBgSync, setIconBgSync] = useState(true)
  const [iconStyleId, setIconStyleId] = useState("rounded")
  const [iconColorSync, setIconColorSync] = useState(true)
  const [iconColorMode, setIconColorMode] = useState<"solid" | "gradient">("solid")
  const [iconColor, setIconColor] = useState("#fbbf24")
  const [iconGradientColors, setIconGradientColors] = useState<string[]>([...DEFAULT_GRADIENT_COLORS])
  const [iconGradientAngle, setIconGradientAngle] = useState(0)
  const [fontLoaded, setFontLoaded] = useState(false)
  const [fontSheet, setFontSheet] = useState<HTMLImageElement | null>(null)
  const [iconSheet, setIconSheet] = useState<HTMLImageElement | null>(null)
  const [iconSheetLoaded, setIconSheetLoaded] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [savingFav, setSavingFav] = useState(false)

  const currentStyle = RANK_TAG_STYLES.find((s) => s.id === styleId) ?? RANK_TAG_STYLES[0]

  const currentConfig: TagConfiguration = {
    text,
    styleId,
    colorMode,
    color,
    gradientColors,
    gradientAngle,
    iconId,
    iconBgSync,
    iconStyleId,
    iconColorSync,
    iconColorMode,
    iconColor,
    iconGradientColors,
    iconGradientAngle,
  }

  const resolvedIconStyleId = iconBgSync ? styleId : iconStyleId

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
    const iconBgUrl = iconId ? getIconBackgroundUrl(resolvedIconStyleId) : null
    const loads = [
      getCachedImage(currentStyle.leftUrl),
      getCachedImage(currentStyle.middleUrl),
      getCachedImage(currentStyle.rightUrl),
    ]
    if (iconBgUrl) loads.push(getCachedImage(iconBgUrl))
    Promise.all(loads).then(() => setImagesLoaded(true))
  }, [currentStyle, iconId, resolvedIconStyleId])

  const loadConfig = useCallback((config: TagConfiguration) => {
    setText(config.text)
    setStyleId(config.styleId)
    setColorMode(config.colorMode)
    setColor(config.color)
    setGradientColors([...config.gradientColors])
    setGradientAngle(config.gradientAngle)
    setIconId(normalizeIconId(config.iconId))
    setIconBgSync(config.iconBgSync)
    setIconStyleId(config.iconStyleId)
    setIconColorSync(config.iconColorSync)
    setIconColorMode(config.iconColorMode)
    setIconColor(config.iconColor)
    setIconGradientColors([...config.iconGradientColors])
    setIconGradientAngle(config.iconGradientAngle)
  }, [])

  useEffect(() => {
    const stashed = consumeStashedTagConfig()
    if (stashed) loadConfig(stashed)
  }, [loadConfig])

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
  }, [color, colorMode, currentConfig, currentStyle, fontLoaded, fontSheet, gradientAngle, gradientColors, iconBgSync, iconColor, iconColorMode, iconColorSync, iconGradientAngle, iconGradientColors, iconId, iconSheet, iconSheetLoaded, iconStyleId, imagesLoaded, resolvedIconStyleId])

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
    setDownloading(false)
  }

  async function handleSaveFavourite() {
    setSavingFav(true)
    try {
      await saveTagToFavourites(currentConfig)
    } catch {
      // Non-blocking
    } finally {
      setSavingFav(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        <div>
          <h1 className="text-2xl font-bold text-[var(--app-text)] tracking-tight">Sam&apos;s Ranks</h1>
          <p className="text-sm text-[var(--app-text-muted)] mt-1">Customize your rank tag in real-time and export as PNG.</p>
        </div>

        <div className="glass rounded-2xl p-4 sm:p-6 flex flex-col gap-6">
          {/* Full-width preview — rank tags are wide & short, not suited to a side column */}
          <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-section-bg)] p-4 sm:p-5">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--app-text)] tracking-tight">Live preview</h3>
                <p className="text-xs text-[var(--app-text-muted)] mt-0.5">Updates as you change settings.</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-full flex items-center justify-center rounded-xl bg-[var(--app-preview-bg)] border border-[var(--app-border)] py-4 px-4 overflow-x-auto">
                  {!fontLoaded || !imagesLoaded || !fontSheet ? (
                    <div className="flex items-center gap-2 text-[var(--app-text-cream)] text-sm py-2">
                      <span className="iconify w-4 h-4 animate-spin text-[var(--app-brand)]" data-icon="mdi:loading" />
                      Loading assets...
                    </div>
                  ) : (
                    <canvas ref={canvasRef} className="rounded-sm max-w-full h-auto block" style={{ imageRendering: "pixelated" }} />
                  )}
                </div>
                <div className="flex flex-row flex-wrap items-center justify-center gap-2.5">
                  <button
                    onClick={handleDownload}
                    disabled={downloading || !fontLoaded || !imagesLoaded}
                    className="flex items-center justify-center gap-2 min-w-[8.5rem] px-5 py-2.5 rounded-xl text-sm font-semibold text-black
                      bg-[var(--app-brand)] hover:bg-[var(--app-brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-150 shadow-[0_4px_14px_rgba(245,158,11,0.2)] active:scale-[0.98]"
                  >
                    <span className="iconify w-4 h-4" data-icon="mdi:download" />
                    {downloading ? "Exporting..." : "Download"}
                  </button>
                  <button
                    onClick={handleSaveFavourite}
                    disabled={savingFav}
                    className="flex items-center justify-center gap-2 min-w-[8.5rem] px-5 py-2.5 rounded-xl text-sm font-semibold
                      bg-[var(--app-input-bg)] text-[var(--app-text-gold)] border border-[rgba(245,158,11,0.3)] hover:bg-[var(--app-surface-2)]
                      disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    <span className="iconify w-4 h-4" data-icon="mdi:star" />
                    {savingFav ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 min-w-0">
              <GeneratorSection
                title="Tag basics"
                description="Text and template style for your rank tag."
                icon="mdi:format-text"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabelClass}>Rank Text</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={text}
                        onChange={(e) => {
                          const filtered = e.target.value.toUpperCase().replace(/[^A-Z0-9_\/\.\- +!]/g, "").slice(0, MAX_TAG_TEXT_LENGTH)
                          setText(filtered)
                        }}
                        placeholder="ADMIN"
                        className={`${inputClass} pr-12`}
                        maxLength={MAX_TAG_TEXT_LENGTH}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <span className="text-xs text-[var(--app-text-muted)]">{text.length}/{MAX_TAG_TEXT_LENGTH}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--app-text-muted)] leading-snug">
                      A–Z, 0–9, _-.+! and space
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabelClass}>Template Style</label>
                    <div className="relative">
                      <select value={styleId} onChange={(e) => setStyleId(e.target.value)} className={selectClass}>
                        {RANK_TAG_STYLES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                        <span className="iconify text-[var(--app-text-muted)]" data-icon="mdi:chevron-down" />
                      </div>
                    </div>
                  </div>
                </div>
              </GeneratorSection>

              <GeneratorSection
                title="Rank tag colors"
                description={
                  iconId && iconColorSync
                    ? "These colors apply to both the rank tag and prefix icon."
                    : "Background tint or gradient for the main rank tag."
                }
                icon="mdi:palette"
              >
                <TagColorControls
                  colorMode={colorMode}
                  color={color}
                  gradientColors={gradientColors}
                  gradientAngle={gradientAngle}
                  onColorModeChange={setColorMode}
                  onColorChange={setColor}
                  onGradientColorsChange={setGradientColors}
                  onGradientAngleChange={setGradientAngle}
                />
              </GeneratorSection>

              <GeneratorSection
                title="Prefix icon"
                description="Optional icon shown before the rank tag."
                icon="mdi:star-four-points"
              >
                <div className="flex flex-col gap-1.5">
                  <label className={fieldLabelClass}>Icon</label>
                  <div className="relative">
                    <select
                      value={iconId ?? ""}
                      onChange={(e) => setIconId(e.target.value || null)}
                      className={selectClass}
                    >
                      <option value="">None</option>
                      {ICON_OPTIONS.map((icon) => (
                        <option key={icon.id} value={icon.id}>
                          {icon.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                      <span className="iconify text-[var(--app-text-muted)]" data-icon="mdi:chevron-down" />
                    </div>
                  </div>
                </div>

                {iconId && (
                  <div className="flex flex-col gap-4 pt-1 border-t border-[rgba(120,80,10,0.12)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SyncToggle
                        label="Sync Icon Background"
                        checked={iconBgSync}
                        onChange={setIconBgSync}
                        description={
                          iconBgSync
                            ? "Uses the same template as the rank tag."
                            : "Pick a different icon box style."
                        }
                      />
                      <SyncToggle
                        label="Sync Icon Colors"
                        checked={iconColorSync}
                        onChange={setIconColorSync}
                        description={
                          iconColorSync
                            ? "Uses rank tag colors for the icon."
                            : "Set icon colors separately below."
                        }
                      />
                    </div>

                    {!iconBgSync && (
                      <div className="flex flex-col gap-1.5 max-w-md">
                        <label className={fieldLabelClass}>Icon Background Style</label>
                        <div className="relative">
                          <select
                            value={iconStyleId}
                            onChange={(e) => setIconStyleId(e.target.value)}
                            className={selectClass}
                          >
                            {RANK_TAG_STYLES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                            <span className="iconify text-[var(--app-text-muted)]" data-icon="mdi:chevron-down" />
                          </div>
                        </div>
                      </div>
                    )}

                    {!iconColorSync && (
                      <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-input-bg)]/50 p-4">
                        <p className={fieldLabelClass}>Icon colors</p>
                        <div className="mt-3">
                          <TagColorControls
                            colorMode={iconColorMode}
                            color={iconColor}
                            gradientColors={iconGradientColors}
                            gradientAngle={iconGradientAngle}
                            onColorModeChange={setIconColorMode}
                            onColorChange={setIconColor}
                            onGradientColorsChange={setIconGradientColors}
                            onGradientAngleChange={setIconGradientAngle}
                            solidLabel="Icon Background Tint"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </GeneratorSection>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--app-text)] tracking-tight">Explore Our Other Work</h2>
            <p className="text-xs text-[var(--app-text-muted)] mt-1">Look at what everything else we have created including our amazing web templates and Plugin Configurations with Custom UIs.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {BBB_PRODUCT_BANNERS.map((banner) => (
              <a
                key={banner.id}
                href={banner.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]"
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

        <footer className="text-center text-sm text-[var(--app-text-muted)] py-4">
          Copyright {new Date().getFullYear()}© Sam&apos;s Ranks. All Rights Reserved.
        </footer>
      </div>
    </>
  )
}
