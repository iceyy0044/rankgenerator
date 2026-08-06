import type { ColorSettings, TagConfiguration } from "@/lib/tag-config-types"
import { getIconColorSettings, getTagColorSettings } from "@/lib/tag-config-types"
import { applyMultiGradient, averageGradientRgb, gradientColorsToJson, normalizeGradientColors, parseGradientColorsFromRow } from "@/lib/gradient-utils"
import type { RankTagStyle } from "@/lib/rank-tag-config"
import {
  getIconBackgroundUrl,
  ICON_BACKGROUND_HEIGHT,
  ICON_BACKGROUND_WIDTH,
  resolveIconStyleId,
} from "@/lib/rank-tag-config"
import {
  getCustomIconDataUrl,
  getIconEntry,
  getLibraryIconRecordId,
  ICON_SHEET_URL,
  ICON_TAG_GAP,
  ICON_X_OFFSET,
  isCustomIconId,
  isLibraryIconId,
  normalizeIconId,
} from "@/lib/icon-sheet-config"

const libraryIconCache: Record<string, Promise<string | null>> = {}

/** Resolves a `library:<id>` icon reference to its image data URL, caching by id. */
function getCachedLibraryIconDataUrl(recordId: string): Promise<string | null> {
  if (!libraryIconCache[recordId]) {
    libraryIconCache[recordId] = fetch(`/api/tag/custom-icons/${recordId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (data ? (data.item.imageData as string) : null))
      .catch(() => null)
  }
  return libraryIconCache[recordId]
}

export const FONT_SHEET_URL = "/font_sheet.png"

export const FONT_MAP: { [key: string]: { x: number; y: number } } = {
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

export const CHAR_WIDTH = 5
export const CHAR_HEIGHT = 7

const imgCache: Record<string, HTMLImageElement> = {}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
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
  colors: string[],
  angle: number
) {
  applyMultiGradient(ctx, x, y, w, h, colors, angle)
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (url.startsWith("http") || url.startsWith("data:")) {
      img.crossOrigin = "anonymous"
    }
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

export async function getCachedImage(url: string): Promise<HTMLImageElement> {
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

function drawTintedSegment(
  ctx: CanvasRenderingContext2D,
  leftImg: HTMLImageElement,
  midImg: HTMLImageElement,
  rightImg: HTMLImageElement,
  x: number,
  y: number,
  style: RankTagStyle,
  midCount: number,
  colors: ColorSettings
) {
  const { leftWidth: leftW, middleWidth: midW, rightWidth: rightW, tileHeight: tileH } = style
  const selectedRgb = hexToRgb(colors.color)
  const gradientStops = normalizeGradientColors(colors.gradientColors)
  const segmentW = leftW + midW * midCount + rightW

  if (colors.colorMode === "solid") {
    tintImageData(ctx, leftImg, x, y, leftW, tileH, selectedRgb)
    for (let i = 0; i < midCount; i++) {
      tintImageData(ctx, midImg, x + leftW + i * midW, y, midW, tileH, selectedRgb)
    }
    tintImageData(ctx, rightImg, x + leftW + midCount * midW, y, rightW, tileH, selectedRgb)
    return
  }

  const maskCanvas = document.createElement("canvas")
  maskCanvas.width = segmentW
  maskCanvas.height = tileH
  const maskCtx = maskCanvas.getContext("2d")
  if (!maskCtx) return

  maskCtx.imageSmoothingEnabled = false
  maskCtx.drawImage(leftImg, 0, 0, leftW, tileH)
  for (let i = 0; i < midCount; i++) {
    maskCtx.drawImage(midImg, leftW + i * midW, 0, midW, tileH)
  }
  maskCtx.drawImage(rightImg, leftW + midCount * midW, 0, rightW, tileH)

  const segCanvas = document.createElement("canvas")
  segCanvas.width = segmentW
  segCanvas.height = tileH
  const segCtx = segCanvas.getContext("2d")
  if (!segCtx) return

  segCtx.imageSmoothingEnabled = false
  segCtx.drawImage(maskCanvas, 0, 0)
  segCtx.globalCompositeOperation = "multiply"
  applyGradient(segCtx, 0, 0, segmentW, tileH, gradientStops, colors.gradientAngle)
  segCtx.globalCompositeOperation = "destination-in"
  segCtx.drawImage(maskCanvas, 0, 0)
  segCtx.globalCompositeOperation = "source-over"

  ctx.drawImage(segCanvas, x, y)
}

function getTintRgb(colors: ColorSettings): { r: number; g: number; b: number } {
  if (colors.colorMode === "solid") return hexToRgb(colors.color)
  return averageGradientRgb(colors.gradientColors)
}

function drawTintedIconBackground(
  ctx: CanvasRenderingContext2D,
  bgImg: HTMLImageElement,
  x: number,
  y: number,
  colors: ColorSettings
) {
  const w = ICON_BACKGROUND_WIDTH
  const h = ICON_BACKGROUND_HEIGHT
  const selectedRgb = hexToRgb(colors.color)
  const gradientStops = normalizeGradientColors(colors.gradientColors)

  if (colors.colorMode === "solid") {
    tintImageData(ctx, bgImg, x, y, w, h, selectedRgb)
    return
  }

  const maskCanvas = document.createElement("canvas")
  maskCanvas.width = w
  maskCanvas.height = h
  const maskCtx = maskCanvas.getContext("2d")
  if (!maskCtx) return

  maskCtx.imageSmoothingEnabled = false
  maskCtx.drawImage(bgImg, 0, 0, w, h)

  const bgCanvas = document.createElement("canvas")
  bgCanvas.width = w
  bgCanvas.height = h
  const bgCtx = bgCanvas.getContext("2d")
  if (!bgCtx) return

  bgCtx.imageSmoothingEnabled = false
  bgCtx.drawImage(maskCanvas, 0, 0)
  bgCtx.globalCompositeOperation = "multiply"
  applyGradient(bgCtx, 0, 0, w, h, gradientStops, colors.gradientAngle)
  bgCtx.globalCompositeOperation = "destination-in"
  bgCtx.drawImage(maskCanvas, 0, 0)
  bgCtx.globalCompositeOperation = "source-over"

  ctx.drawImage(bgCanvas, x, y)
}

interface IconGlyphSource {
  img: HTMLImageElement
  x: number
  y: number
  w: number
  h: number
  /** Horizontal nudge from center — sprite icons carry their own internal padding baked into the image and need `ICON_X_OFFSET`; hand-drawn custom icons fill their canvas edge-to-edge and center correctly without it. */
  xOffset: number
}

/** Resolves the sprite-sheet crop rect for a built-in icon, or the whole image for a custom one. */
function getIconGlyphSource(iconId: string, iconSheet: HTMLImageElement | null, customImg: HTMLImageElement | null): IconGlyphSource | null {
  if (isCustomIconId(iconId) || isLibraryIconId(iconId)) {
    if (!customImg) return null
    return { img: customImg, x: 0, y: 0, w: customImg.naturalWidth, h: customImg.naturalHeight, xOffset: 0 }
  }
  if (!iconSheet) return null
  const entry = getIconEntry(iconId)
  if (!entry) return null
  return { img: iconSheet, x: entry.x, y: entry.y, w: entry.w, h: entry.h, xOffset: ICON_X_OFFSET }
}

function drawIconGlyph(
  ctx: CanvasRenderingContext2D,
  source: IconGlyphSource,
  prefixX: number,
  prefixW: number,
  y: number,
  tileH: number,
  textTintRgb: { r: number; g: number; b: number }
) {
  const { img, x: sx, y: sy, w, h, xOffset } = source
  const drawX = prefixX + Math.floor((prefixW - w) / 2) + xOffset
  const drawY = y + Math.floor((tileH - h) / 2)

  const shadowCtx = document.createElement("canvas").getContext("2d")
  if (!shadowCtx) return
  shadowCtx.canvas.width = w
  shadowCtx.canvas.height = h
  shadowCtx.drawImage(img, sx, sy, w, h, 0, 0, w, h)
  shadowCtx.globalCompositeOperation = "source-in"
  shadowCtx.fillStyle = "rgba(0,0,0,0.55)"
  shadowCtx.fillRect(0, 0, w, h)
  ctx.drawImage(shadowCtx.canvas, drawX, drawY + 1)

  const glyphCtx = document.createElement("canvas").getContext("2d")
  if (!glyphCtx) return
  glyphCtx.canvas.width = w
  glyphCtx.canvas.height = h
  glyphCtx.drawImage(img, sx, sy, w, h, 0, 0, w, h)
  glyphCtx.globalCompositeOperation = "source-in"
  glyphCtx.fillStyle = "#ffffff"
  glyphCtx.fillRect(0, 0, w, h)

  const baseRgb = { r: 205, g: 205, b: 205 }
  const mixedRgb = {
    r: Math.round(baseRgb.r * 0.8 + textTintRgb.r * 0.2),
    g: Math.round(baseRgb.g * 0.8 + textTintRgb.g * 0.2),
    b: Math.round(baseRgb.b * 0.8 + textTintRgb.b * 0.2),
  }
  glyphCtx.globalCompositeOperation = "source-atop"
  glyphCtx.fillStyle = `rgba(${mixedRgb.r}, ${mixedRgb.g}, ${mixedRgb.b}, 0.4)`
  glyphCtx.fillRect(0, h - 3, w, 3)

  ctx.drawImage(glyphCtx.canvas, drawX, drawY)
}

function drawTextGlyphs(
  ctx: CanvasRenderingContext2D,
  fontSheet: HTMLImageElement,
  text: string,
  x: number,
  y: number,
  style: RankTagStyle,
  textTintRgb: { r: number; g: number; b: number }
) {
  const { leftWidth: leftW, middleWidth: midW, tileHeight: tileH } = style
  const charCount = text.length

  for (let i = 0; i < charCount; i++) {
    const ch = text[i]
    const fontChar = FONT_MAP[ch]
    if (!fontChar) continue

    const cx = x + leftW + i * midW + Math.floor((midW - CHAR_WIDTH) / 2)
    const textY = y + Math.floor((tileH - CHAR_HEIGHT) / 2)

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
}

export interface RenderTagOptions {
  config: TagConfiguration
  style: RankTagStyle
  fontSheet: HTMLImageElement
  iconSheet: HTMLImageElement | null
}

export async function renderRankTag(
  canvas: HTMLCanvasElement,
  { config, style, fontSheet, iconSheet }: RenderTagOptions
): Promise<void> {
  const displayText = config.text || " "
  const tileH = style.tileHeight
  const leftW = style.leftWidth
  const rightW = style.rightWidth
  const midW = style.middleWidth
  const charCount = displayText.length
  const mainW = leftW + midW * charCount + rightW

  const isEmbeddedIcon = isCustomIconId(config.iconId)
  const isLibraryIcon = isLibraryIconId(config.iconId)
  const isCustomStyleIcon = isEmbeddedIcon || isLibraryIcon
  const iconEntry = config.iconId && !isCustomStyleIcon ? getIconEntry(config.iconId) : null
  const hasIconPrefix = isCustomStyleIcon || Boolean(iconEntry)
  const iconPrefixW = hasIconPrefix ? ICON_BACKGROUND_WIDTH : 0
  const iconGap = hasIconPrefix ? ICON_TAG_GAP : 0
  const totalW = iconPrefixW + iconGap + mainW

  canvas.width = totalW
  canvas.height = tileH

  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return

  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, totalW, tileH)

  const [leftImg, midImg, rightImg] = await Promise.all([
    getCachedImage(style.leftUrl),
    getCachedImage(style.middleUrl),
    getCachedImage(style.rightUrl),
  ])

  const tagColors = getTagColorSettings(config)
  const textTintRgb = getTintRgb(tagColors)
  const iconColors = getIconColorSettings(config)
  const iconTintRgb = getTintRgb(iconColors)

  let mainX = 0

  let resolvedIconSheet = iconSheet
  if (hasIconPrefix && !isCustomStyleIcon && !resolvedIconSheet) {
    try {
      resolvedIconSheet = await getCachedImage(ICON_SHEET_URL)
    } catch {
      resolvedIconSheet = null
    }
  }

  let customIconImg: HTMLImageElement | null = null
  if (config.iconId && isEmbeddedIcon) {
    try {
      customIconImg = await getCachedImage(getCustomIconDataUrl(config.iconId))
    } catch {
      customIconImg = null
    }
  } else if (config.iconId && isLibraryIcon) {
    try {
      const dataUrl = await getCachedLibraryIconDataUrl(getLibraryIconRecordId(config.iconId))
      customIconImg = dataUrl ? await getCachedImage(dataUrl) : null
    } catch {
      customIconImg = null
    }
  }

  if (hasIconPrefix && config.iconId) {
    const iconStyleId = resolveIconStyleId(config.styleId, config.iconBgSync, config.iconStyleId)
    const iconBgImg = await getCachedImage(getIconBackgroundUrl(iconStyleId))
    drawTintedIconBackground(ctx, iconBgImg, 0, 0, iconColors)
    const glyphSource = getIconGlyphSource(config.iconId, resolvedIconSheet, customIconImg)
    if (glyphSource) {
      drawIconGlyph(ctx, glyphSource, 0, ICON_BACKGROUND_WIDTH, 0, ICON_BACKGROUND_HEIGHT, iconTintRgb)
    }
    mainX = iconPrefixW + iconGap
  }

  drawTintedSegment(ctx, leftImg, midImg, rightImg, mainX, 0, style, charCount, tagColors)
  drawTextGlyphs(ctx, fontSheet, displayText, mainX, 0, style, textTintRgb)
}

export function configToDbRow(config: TagConfiguration, userId: string) {
  const tagGradient = normalizeGradientColors(config.gradientColors)
  const iconGradient = normalizeGradientColors(config.iconGradientColors)

  return {
    user_id: userId,
    text: config.text,
    style_id: config.styleId,
    color_mode: config.colorMode,
    color: config.color,
    gradient_start: tagGradient[0],
    gradient_end: tagGradient[tagGradient.length - 1],
    gradient_colors: gradientColorsToJson(tagGradient),
    gradient_angle: config.gradientAngle,
    icon_id: config.iconId,
    icon_bg_sync: config.iconBgSync,
    icon_style_id: config.iconStyleId,
    icon_color_sync: config.iconColorSync,
    icon_color_mode: config.iconColorMode,
    icon_color: config.iconColor,
    icon_gradient_start: iconGradient[0],
    icon_gradient_end: iconGradient[iconGradient.length - 1],
    icon_gradient_colors: gradientColorsToJson(iconGradient),
    icon_gradient_angle: config.iconGradientAngle,
  }
}

export function rowToConfig(row: Record<string, unknown>): TagConfiguration {
  const rawIconId = row.icon_id ? String(row.icon_id) : null
  const tagGradient = parseGradientColorsFromRow(row)
  const iconGradient = parseGradientColorsFromRow(row, "icon_")

  return {
    text: String(row.text ?? ""),
    styleId: String(row.style_id ?? "rounded"),
    colorMode: (row.color_mode as TagConfiguration["colorMode"]) ?? "solid",
    color: String(row.color ?? "#fbbf24"),
    gradientColors: tagGradient,
    gradientAngle: Number(row.gradient_angle ?? 0),
    iconId: normalizeIconId(rawIconId),
    iconBgSync: row.icon_bg_sync !== undefined ? Boolean(row.icon_bg_sync) : true,
    iconStyleId: String(row.icon_style_id ?? "rounded"),
    iconColorSync: row.icon_color_sync !== undefined ? Boolean(row.icon_color_sync) : true,
    iconColorMode: (row.icon_color_mode as TagConfiguration["colorMode"]) ?? "solid",
    iconColor: String(row.icon_color ?? "#fbbf24"),
    iconGradientColors: iconGradient,
    iconGradientAngle: Number(row.icon_gradient_angle ?? 0),
  }
}

export function rowToHistoryEntry(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    ...rowToConfig(row),
  }
}

export function rowToFavouriteEntry(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: row.name ? String(row.name) : null,
    created_at: String(row.created_at),
    folderId: row.folder_id ? String(row.folder_id) : null,
    position: Number(row.position ?? 0),
    isPublic: Boolean(row.is_public),
    ...rowToConfig(row),
  }
}

export function rowToCustomIconEntry(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name ?? "Untitled Icon"),
    imageData: String(row.image_data ?? ""),
    isPublic: Boolean(row.is_public),
    created_at: String(row.created_at),
  }
}

export function rowToFolderEntry(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name),
    created_at: String(row.created_at),
  }
}
