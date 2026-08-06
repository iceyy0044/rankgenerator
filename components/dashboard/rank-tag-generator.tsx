"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { RANK_TAG_STYLES, DEFAULT_STYLE_ID, getIconBackgroundUrl } from "@/lib/rank-tag-config"
import { FONT_SHEET_URL, getCachedImage, loadImage, renderRankTag } from "@/lib/rank-tag-render"
import { type ColorMode, type TagConfiguration, MAX_TAG_TEXT_LENGTH } from "@/lib/tag-config-types"
import { ICON_OPTIONS, ICON_SHEET_URL, isCustomIconId, normalizeIconId } from "@/lib/icon-sheet-config"
import { DEFAULT_GRADIENT_COLORS } from "@/lib/gradient-utils"
import { useUndoable } from "@/lib/use-undoable"
import TagColorControls from "@/components/dashboard/tag-color-controls"
import SyncToggle from "@/components/dashboard/sync-toggle"
import { saveTagToHistory, saveTagToFavourites } from "@/components/dashboard/tag-saved-panel"
import { consumeStashedTagConfig } from "@/lib/tag-config-storage"
import GeneratorSection, {
  fieldLabelClass,
  inputClass,
  selectClass,
  SectionHistoryControls,
} from "@/components/dashboard/generator-section"
import TrueSizePreview from "@/components/dashboard/true-size-preview"
import PixelIconEditor from "@/components/dashboard/pixel-icon-editor"

const FONT_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5x5-font-monospaced-0fGxzkqEby3jzE6VeuPUC7wYMuj5oZ.ttf"
const FONT_FAMILY = "RankFont"

interface BasicsState {
  text: string
  styleId: string
}

interface ColorsState {
  colorMode: ColorMode
  color: string
  gradientColors: string[]
  gradientAngle: number
}

interface IconState {
  iconId: string | null
  iconBgSync: boolean
  iconStyleId: string
  iconColorSync: boolean
  iconColorMode: ColorMode
  iconColor: string
  iconGradientColors: string[]
  iconGradientAngle: number
}

const DEFAULT_BASICS: BasicsState = { text: "ADMIN", styleId: DEFAULT_STYLE_ID }
const DEFAULT_COLORS: ColorsState = {
  colorMode: "solid",
  color: "#fbbf24",
  gradientColors: [...DEFAULT_GRADIENT_COLORS],
  gradientAngle: 0,
}
const DEFAULT_ICON: IconState = {
  iconId: null,
  iconBgSync: true,
  iconStyleId: "rounded",
  iconColorSync: true,
  iconColorMode: "solid",
  iconColor: "#fbbf24",
  iconGradientColors: [...DEFAULT_GRADIENT_COLORS],
  iconGradientAngle: 0,
}

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
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const previewDimensionsRef = useRef({ w: 0, h: 0 })

  const PREVIEW_PIXEL_SCALE = 12

  const basics = useUndoable<BasicsState>(DEFAULT_BASICS)
  const colors = useUndoable<ColorsState>(DEFAULT_COLORS)
  const icon = useUndoable<IconState>(DEFAULT_ICON)

  const updateBasics = useCallback(
    (patch: Partial<BasicsState>) => basics.set({ ...basics.value, ...patch }),
    [basics]
  )
  const updateColors = useCallback(
    (patch: Partial<ColorsState>) => colors.set({ ...colors.value, ...patch }),
    [colors]
  )
  const updateIcon = useCallback((patch: Partial<IconState>) => icon.set({ ...icon.value, ...patch }), [icon])

  const [fontLoaded, setFontLoaded] = useState(false)
  const [fontSheet, setFontSheet] = useState<HTMLImageElement | null>(null)
  const [iconSheet, setIconSheet] = useState<HTMLImageElement | null>(null)
  const [iconSheetLoaded, setIconSheetLoaded] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [savingFav, setSavingFav] = useState(false)
  const [showTrueSize, setShowTrueSize] = useState(false)
  const [iconEditorOpen, setIconEditorOpen] = useState(false)

  const currentStyle = RANK_TAG_STYLES.find((s) => s.id === basics.value.styleId) ?? RANK_TAG_STYLES[0]

  const currentConfig: TagConfiguration = {
    text: basics.value.text,
    styleId: basics.value.styleId,
    colorMode: colors.value.colorMode,
    color: colors.value.color,
    gradientColors: colors.value.gradientColors,
    gradientAngle: colors.value.gradientAngle,
    iconId: icon.value.iconId,
    iconBgSync: icon.value.iconBgSync,
    iconStyleId: icon.value.iconStyleId,
    iconColorSync: icon.value.iconColorSync,
    iconColorMode: icon.value.iconColorMode,
    iconColor: icon.value.iconColor,
    iconGradientColors: icon.value.iconGradientColors,
    iconGradientAngle: icon.value.iconGradientAngle,
  }

  const resolvedIconStyleId = icon.value.iconBgSync ? basics.value.styleId : icon.value.iconStyleId

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
    const iconBgUrl = icon.value.iconId ? getIconBackgroundUrl(resolvedIconStyleId) : null
    const loads = [
      getCachedImage(currentStyle.leftUrl),
      getCachedImage(currentStyle.middleUrl),
      getCachedImage(currentStyle.rightUrl),
    ]
    if (iconBgUrl) loads.push(getCachedImage(iconBgUrl))
    Promise.all(loads).then(() => setImagesLoaded(true))
  }, [currentStyle, icon.value.iconId, resolvedIconStyleId])

  const { load: basicsLoad } = basics
  const { load: colorsLoad } = colors
  const { load: iconLoad } = icon

  const loadConfig = useCallback(
    (config: TagConfiguration) => {
      basicsLoad({ text: config.text, styleId: config.styleId })
      colorsLoad({
        colorMode: config.colorMode,
        color: config.color,
        gradientColors: [...config.gradientColors],
        gradientAngle: config.gradientAngle,
      })
      iconLoad({
        iconId: normalizeIconId(config.iconId),
        iconBgSync: config.iconBgSync,
        iconStyleId: config.iconStyleId,
        iconColorSync: config.iconColorSync,
        iconColorMode: config.iconColorMode,
        iconColor: config.iconColor,
        iconGradientColors: [...config.iconGradientColors],
        iconGradientAngle: config.iconGradientAngle,
      })
    },
    [basicsLoad, colorsLoad, iconLoad]
  )

  useEffect(() => {
    const stashed = consumeStashedTagConfig()
    if (stashed) loadConfig(stashed)
  }, [loadConfig])

  const fitPreviewToContainer = useCallback(() => {
    const display = canvasRef.current
    const container = previewContainerRef.current
    const { w, h } = previewDimensionsRef.current
    if (!display || !w || !h) return

    const maxW = container?.clientWidth ?? w
    const fitScale = Math.min(1, maxW / w)
    display.style.width = `${Math.floor(w * fitScale)}px`
    display.style.height = `${Math.floor(h * fitScale)}px`
  }, [])

  useEffect(() => {
    const container = previewContainerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => fitPreviewToContainer())
    observer.observe(container)
    return () => observer.disconnect()
  }, [fitPreviewToContainer])

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
    if (!display) return
    const displayW = off.width * PREVIEW_PIXEL_SCALE
    const displayH = off.height * PREVIEW_PIXEL_SCALE

    display.width = displayW
    display.height = displayH

    const dCtx = display.getContext("2d")
    if (!dCtx) return
    dCtx.imageSmoothingEnabled = false
    dCtx.drawImage(off, 0, 0, displayW, displayH)

    previewDimensionsRef.current = { w: displayW, h: displayH }
    fitPreviewToContainer()
  }, [
    basics.value,
    colors.value,
    icon.value,
    currentStyle,
    fitPreviewToContainer,
    fontLoaded,
    fontSheet,
    iconSheet,
    iconSheetLoaded,
    imagesLoaded,
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
    link.download = `${basics.value.text || "rank"}.png`
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
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--app-text)] tracking-tight">Live preview</h3>
                  <p className="text-xs text-[var(--app-text-muted)] mt-0.5">Updates as you change settings.</p>
                </div>
                <button
                  onClick={() => setShowTrueSize((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    showTrueSize
                      ? "bg-[var(--app-brand)] text-black"
                      : "bg-[var(--app-input-bg)] text-[var(--app-text)] hover:bg-[var(--app-surface-2)]"
                  }`}
                >
                  {showTrueSize ? "Editor preview" : "True size preview"}
                </button>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div
                  ref={previewContainerRef}
                  className="w-full flex items-center justify-center rounded-xl bg-[var(--app-preview-bg)] border border-[var(--app-border)] py-4 px-4 overflow-hidden min-h-[5.5rem]"
                  style={{ display: showTrueSize ? "none" : "flex" }}
                >
                  {!fontLoaded || !imagesLoaded || !fontSheet ? (
                    <div className="flex items-center gap-2 text-[var(--app-text-cream)] text-sm py-2">
                      <span className="iconify w-4 h-4 animate-spin text-[var(--app-brand)]" data-icon="mdi:loading" />
                      Loading assets...
                    </div>
                  ) : (
                    <canvas ref={canvasRef} className="rounded-sm block" style={{ imageRendering: "pixelated" }} />
                  )}
                </div>
                {showTrueSize && fontSheet && (
                  <TrueSizePreview config={currentConfig} style={currentStyle} fontSheet={fontSheet} iconSheet={iconSheet} />
                )}
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
                actions={
                  <SectionHistoryControls
                    onUndo={basics.undo}
                    onRedo={basics.redo}
                    onReset={() => basics.set(DEFAULT_BASICS)}
                    canUndo={basics.canUndo}
                    canRedo={basics.canRedo}
                  />
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabelClass}>Rank Text</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={basics.value.text}
                        onChange={(e) => {
                          const filtered = e.target.value.toUpperCase().replace(/[^A-Z0-9_\/\.\- +!]/g, "").slice(0, MAX_TAG_TEXT_LENGTH)
                          updateBasics({ text: filtered })
                        }}
                        placeholder="ADMIN"
                        className={`${inputClass} pr-12`}
                        maxLength={MAX_TAG_TEXT_LENGTH}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <span className="text-xs text-[var(--app-text-muted)]">{basics.value.text.length}/{MAX_TAG_TEXT_LENGTH}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--app-text-muted)] leading-snug">
                      A–Z, 0–9, _-.+! and space
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabelClass}>Template Style</label>
                    <div className="relative">
                      <select
                        value={basics.value.styleId}
                        onChange={(e) => updateBasics({ styleId: e.target.value })}
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
                </div>
              </GeneratorSection>

              <GeneratorSection
                title="Rank tag colors"
                description={
                  icon.value.iconId && icon.value.iconColorSync
                    ? "These colors apply to both the rank tag and prefix icon."
                    : "Background tint or gradient for the main rank tag."
                }
                icon="mdi:palette"
                actions={
                  <SectionHistoryControls
                    onUndo={colors.undo}
                    onRedo={colors.redo}
                    onReset={() => colors.set(DEFAULT_COLORS)}
                    canUndo={colors.canUndo}
                    canRedo={colors.canRedo}
                  />
                }
              >
                <TagColorControls
                  colorMode={colors.value.colorMode}
                  color={colors.value.color}
                  gradientColors={colors.value.gradientColors}
                  gradientAngle={colors.value.gradientAngle}
                  onColorModeChange={(m) => updateColors({ colorMode: m })}
                  onColorChange={(c) => updateColors({ color: c })}
                  onGradientColorsChange={(g) => updateColors({ gradientColors: g })}
                  onGradientAngleChange={(a) => updateColors({ gradientAngle: a })}
                />
              </GeneratorSection>

              <GeneratorSection
                title="Prefix icon"
                description="Optional icon shown before the rank tag."
                icon="mdi:star-four-points"
                actions={
                  <SectionHistoryControls
                    onUndo={icon.undo}
                    onRedo={icon.redo}
                    onReset={() => icon.set(DEFAULT_ICON)}
                    canUndo={icon.canUndo}
                    canRedo={icon.canRedo}
                  />
                }
              >
                <div className="flex flex-col gap-1.5">
                  <label className={fieldLabelClass}>Icon</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={icon.value.iconId ?? ""}
                        onChange={(e) => updateIcon({ iconId: e.target.value || null })}
                        className={selectClass}
                      >
                        <option value="">None</option>
                        {isCustomIconId(icon.value.iconId) && <option value={icon.value.iconId}>Custom icon</option>}
                        {ICON_OPTIONS.map((iconOption) => (
                          <option key={iconOption.id} value={iconOption.id}>
                            {iconOption.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                        <span className="iconify text-[var(--app-text-muted)]" data-icon="mdi:chevron-down" />
                      </div>
                    </div>
                    <button
                      onClick={() => setIconEditorOpen(true)}
                      title={isCustomIconId(icon.value.iconId) ? "Edit custom icon" : "Draw a custom icon"}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium
                        bg-[var(--app-input-bg)] text-[var(--app-text)] border border-[var(--app-border)]
                        hover:bg-[var(--app-surface-2)] hover:border-[var(--app-brand)] transition-all"
                    >
                      <span className="iconify w-4 h-4" data-icon="mdi:brush" />
                      Draw
                    </button>
                  </div>
                </div>

                {icon.value.iconId && (
                  <div className="flex flex-col gap-4 pt-1 border-t border-[rgba(120,80,10,0.12)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SyncToggle
                        label="Sync Icon Background"
                        checked={icon.value.iconBgSync}
                        onChange={(v) => updateIcon({ iconBgSync: v })}
                        description={
                          icon.value.iconBgSync
                            ? "Uses the same template as the rank tag."
                            : "Pick a different icon box style."
                        }
                      />
                      <SyncToggle
                        label="Sync Icon Colors"
                        checked={icon.value.iconColorSync}
                        onChange={(v) => updateIcon({ iconColorSync: v })}
                        description={
                          icon.value.iconColorSync
                            ? "Uses rank tag colors for the icon."
                            : "Set icon colors separately below."
                        }
                      />
                    </div>

                    {!icon.value.iconBgSync && (
                      <div className="flex flex-col gap-1.5 max-w-md">
                        <label className={fieldLabelClass}>Icon Background Style</label>
                        <div className="relative">
                          <select
                            value={icon.value.iconStyleId}
                            onChange={(e) => updateIcon({ iconStyleId: e.target.value })}
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

                    {!icon.value.iconColorSync && (
                      <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-input-bg)]/50 p-4">
                        <p className={fieldLabelClass}>Icon colors</p>
                        <div className="mt-3">
                          <TagColorControls
                            colorMode={icon.value.iconColorMode}
                            color={icon.value.iconColor}
                            gradientColors={icon.value.iconGradientColors}
                            gradientAngle={icon.value.iconGradientAngle}
                            onColorModeChange={(m) => updateIcon({ iconColorMode: m })}
                            onColorChange={(c) => updateIcon({ iconColor: c })}
                            onGradientColorsChange={(g) => updateIcon({ iconGradientColors: g })}
                            onGradientAngleChange={(a) => updateIcon({ iconGradientAngle: a })}
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

        <PixelIconEditor
          open={iconEditorOpen}
          onOpenChange={setIconEditorOpen}
          initialIconId={icon.value.iconId}
          onSave={(iconId) => updateIcon({ iconId })}
        />

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
