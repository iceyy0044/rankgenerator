import type { TagConfiguration } from "@/lib/tag-config-types"
import type { RankTagStyle } from "@/lib/rank-tag-config"
import { getIconEntry, ICON_SHEET_URL, ICON_TAG_GAP } from "@/lib/icon-sheet-config"

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

  const gradient = ctx.createLinearGradient(centerX - dx, centerY - dy, centerX + dx, centerY + dy)
  gradient.addColorStop(0, `rgb(${colorStart.r}, ${colorStart.g}, ${colorStart.b})`)
  gradient.addColorStop(1, `rgb(${colorEnd.r}, ${colorEnd.g}, ${colorEnd.b})`)

  ctx.fillStyle = gradient
  ctx.fillRect(x, y, w, h)
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
  config: TagConfiguration
) {
  const { leftWidth: leftW, middleWidth: midW, rightWidth: rightW, tileHeight: tileH } = style
  const selectedRgb = hexToRgb(config.color)
  const startRgb = hexToRgb(config.gradientStart)
  const endRgb = hexToRgb(config.gradientEnd)
  const segmentW = leftW + midW * midCount + rightW

  if (config.colorMode === "solid") {
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

  ctx.drawImage(maskCanvas, x, y)
  ctx.globalCompositeOperation = "multiply"
  applyGradient(ctx, x, y, segmentW, tileH, startRgb, endRgb, config.gradientAngle)
  ctx.globalCompositeOperation = "destination-in"
  ctx.drawImage(maskCanvas, x, y)
  ctx.globalCompositeOperation = "source-over"
}

function drawTintedIconPrefix(
  ctx: CanvasRenderingContext2D,
  leftImg: HTMLImageElement,
  rightImg: HTMLImageElement,
  x: number,
  y: number,
  style: RankTagStyle,
  config: TagConfiguration
) {
  const { leftWidth: leftW, rightWidth: rightW, tileHeight: tileH } = style
  const segmentW = leftW + rightW
  const selectedRgb = hexToRgb(config.color)
  const startRgb = hexToRgb(config.gradientStart)
  const endRgb = hexToRgb(config.gradientEnd)

  if (config.colorMode === "solid") {
    tintImageData(ctx, leftImg, x, y, leftW, tileH, selectedRgb)
    tintImageData(ctx, rightImg, x + leftW, y, rightW, tileH, selectedRgb)
    return
  }

  const maskCanvas = document.createElement("canvas")
  maskCanvas.width = segmentW
  maskCanvas.height = tileH
  const maskCtx = maskCanvas.getContext("2d")
  if (!maskCtx) return

  maskCtx.imageSmoothingEnabled = false
  maskCtx.drawImage(leftImg, 0, 0, leftW, tileH)
  maskCtx.drawImage(rightImg, leftW, 0, rightW, tileH)

  ctx.drawImage(maskCanvas, x, y)
  ctx.globalCompositeOperation = "multiply"
  applyGradient(ctx, x, y, segmentW, tileH, startRgb, endRgb, config.gradientAngle)
  ctx.globalCompositeOperation = "destination-in"
  ctx.drawImage(maskCanvas, x, y)
  ctx.globalCompositeOperation = "source-over"
}

function drawIconGlyph(
  ctx: CanvasRenderingContext2D,
  iconSheet: HTMLImageElement,
  iconId: string,
  prefixX: number,
  prefixW: number,
  y: number,
  tileH: number,
  textTintRgb: { r: number; g: number; b: number }
) {
  const entry = getIconEntry(iconId)
  if (!entry) return

  const w = entry.w
  const h = entry.h
  const drawX = prefixX + Math.floor((prefixW - w) / 2) + 1
  const drawY = y + Math.floor((tileH - h) / 2)

  const shadowCtx = document.createElement("canvas").getContext("2d")
  if (!shadowCtx) return
  shadowCtx.canvas.width = w
  shadowCtx.canvas.height = h
  shadowCtx.drawImage(iconSheet, entry.x, entry.y, w, h, 0, 0, w, h)
  shadowCtx.globalCompositeOperation = "source-in"
  shadowCtx.fillStyle = "rgba(0,0,0,0.55)"
  shadowCtx.fillRect(0, 0, w, h)
  ctx.drawImage(shadowCtx.canvas, drawX + 1, drawY + 1)

  const glyphCtx = document.createElement("canvas").getContext("2d")
  if (!glyphCtx) return
  glyphCtx.canvas.width = w
  glyphCtx.canvas.height = h
  glyphCtx.drawImage(iconSheet, entry.x, entry.y, w, h, 0, 0, w, h)
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

  ctx.drawImage(glyphCtx.canvas, drawX + 1, drawY)
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

  const iconEntry = config.iconId ? getIconEntry(config.iconId) : null
  const hasIconPrefix = Boolean(iconEntry)
  const iconPrefixW = hasIconPrefix ? leftW + rightW : 0
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

  const selectedRgb = hexToRgb(config.color)
  const startRgb = hexToRgb(config.gradientStart)
  const endRgb = hexToRgb(config.gradientEnd)
  const gradientMid = {
    r: Math.round((startRgb.r + endRgb.r) / 2),
    g: Math.round((startRgb.g + endRgb.g) / 2),
    b: Math.round((startRgb.b + endRgb.b) / 2),
  }
  const textTintRgb = config.colorMode === "solid" ? selectedRgb : gradientMid

  let mainX = 0

  let resolvedIconSheet = iconSheet
  if (hasIconPrefix && !resolvedIconSheet) {
    try {
      resolvedIconSheet = await getCachedImage(ICON_SHEET_URL)
    } catch {
      resolvedIconSheet = null
    }
  }

  if (hasIconPrefix && config.iconId) {
    drawTintedIconPrefix(ctx, leftImg, rightImg, 0, 0, style, config)
    if (resolvedIconSheet) {
      drawIconGlyph(ctx, resolvedIconSheet, config.iconId, 0, iconPrefixW, 0, tileH, textTintRgb)
    }
    mainX = iconPrefixW + iconGap
  }

  drawTintedSegment(ctx, leftImg, midImg, rightImg, mainX, 0, style, charCount, config)
  drawTextGlyphs(ctx, fontSheet, displayText, mainX, 0, style, textTintRgb)
}

export function configToDbRow(config: TagConfiguration, userId: string) {
  return {
    user_id: userId,
    text: config.text,
    style_id: config.styleId,
    color_mode: config.colorMode,
    color: config.color,
    gradient_start: config.gradientStart,
    gradient_end: config.gradientEnd,
    gradient_angle: config.gradientAngle,
    icon_id: config.iconId,
  }
}

export function rowToConfig(row: Record<string, unknown>): TagConfiguration {
  const rawIconId = row.icon_id ? String(row.icon_id) : null

  return {
    text: String(row.text ?? ""),
    styleId: String(row.style_id ?? "rounded"),
    colorMode: (row.color_mode as TagConfiguration["colorMode"]) ?? "solid",
    color: String(row.color ?? "#fbbf24"),
    gradientStart: String(row.gradient_start ?? "#0051FF"),
    gradientEnd: String(row.gradient_end ?? "#FFFFFF"),
    gradientAngle: Number(row.gradient_angle ?? 0),
    iconId: rawIconId && getIconEntry(rawIconId) ? rawIconId : null,
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
    ...rowToConfig(row),
  }
}
