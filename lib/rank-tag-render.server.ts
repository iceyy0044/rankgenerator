/**
 * Server-side counterpart to `lib/rank-tag-render.ts`.
 *
 * The browser renderer draws into an `HTMLCanvasElement` using the DOM Canvas2D
 * API. Node has no DOM, so this file reimplements the same pixel algorithm
 * (identical composite operations, identical math) on top of `@napi-rs/canvas`,
 * a native Canvas2D-API-compatible implementation. Images are read from disk
 * instead of fetched over HTTP. Pure helpers (font map, icon lookup, color
 * resolution, gradient math) are imported from the browser modules — they
 * don't touch the DOM, so they're safe to share.
 *
 * If you change how a tag is drawn (new blend mode, new offset, etc.) in
 * `renderRankTag` (browser), mirror the change in `renderRankTagBuffer` below
 * so the API route stays visually identical to the in-app preview/download.
 */
import fs from "fs/promises"
import path from "path"
import { Canvas, Image, createCanvas, loadImage } from "@napi-rs/canvas"
import type { ColorSettings, TagConfiguration } from "@/lib/tag-config-types"
import { getIconColorSettings, getTagColorSettings } from "@/lib/tag-config-types"
import { applyMultiGradient, averageGradientRgb, normalizeGradientColors } from "@/lib/gradient-utils"
import type { RankTagStyle } from "@/lib/rank-tag-config"
import { ICON_BACKGROUND_HEIGHT, ICON_BACKGROUND_WIDTH, resolveIconStyleId } from "@/lib/rank-tag-config"
import { getIconBackgroundUrlServer } from "@/lib/rank-tag-config.server"
import { CHAR_HEIGHT, CHAR_WIDTH, FONT_MAP, hexToRgb } from "@/lib/rank-tag-render"
import { ICON_TAG_GAP, ICON_X_OFFSET, getIconEntry } from "@/lib/icon-sheet-config"

const FONT_SHEET_PATH = "font_sheet.png"
const ICON_SHEET_PATH = "icon_sheet.png"

const imageCache = new Map<string, Promise<Image>>()

/** Loads (and caches) a `public/`-relative image as a decoded `@napi-rs/canvas` Image. */
function getCachedImage(publicRelativePath: string): Promise<Image> {
  let cached = imageCache.get(publicRelativePath)
  if (!cached) {
    cached = fs
      .readFile(path.join(process.cwd(), "public", publicRelativePath))
      .then((buf) => loadImage(buf))
    imageCache.set(publicRelativePath, cached)
  }
  return cached
}

function newCanvas(w: number, h: number): Canvas {
  return createCanvas(w, h)
}

/** Tints an image by (grayscale luminance) * color, matching `tintImageData` in the browser renderer. */
function tintImageData(
  ctx: import("@napi-rs/canvas").SKRSContext2D,
  img: Image,
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
  ctx: import("@napi-rs/canvas").SKRSContext2D,
  leftImg: Image,
  midImg: Image,
  rightImg: Image,
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

  const maskCanvas = newCanvas(segmentW, tileH)
  const maskCtx = maskCanvas.getContext("2d")
  maskCtx.imageSmoothingEnabled = false
  maskCtx.drawImage(leftImg, 0, 0, leftW, tileH)
  for (let i = 0; i < midCount; i++) {
    maskCtx.drawImage(midImg, leftW + i * midW, 0, midW, tileH)
  }
  maskCtx.drawImage(rightImg, leftW + midCount * midW, 0, rightW, tileH)

  const segCanvas = newCanvas(segmentW, tileH)
  const segCtx = segCanvas.getContext("2d")
  segCtx.imageSmoothingEnabled = false
  segCtx.drawImage(maskCanvas, 0, 0)
  segCtx.globalCompositeOperation = "multiply"
  applyMultiGradient(segCtx, 0, 0, segmentW, tileH, gradientStops, colors.gradientAngle)
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
  ctx: import("@napi-rs/canvas").SKRSContext2D,
  bgImg: Image,
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

  const maskCanvas = newCanvas(w, h)
  const maskCtx = maskCanvas.getContext("2d")
  maskCtx.imageSmoothingEnabled = false
  maskCtx.drawImage(bgImg, 0, 0, w, h)

  const bgCanvas = newCanvas(w, h)
  const bgCtx = bgCanvas.getContext("2d")
  bgCtx.imageSmoothingEnabled = false
  bgCtx.drawImage(maskCanvas, 0, 0)
  bgCtx.globalCompositeOperation = "multiply"
  applyMultiGradient(bgCtx, 0, 0, w, h, gradientStops, colors.gradientAngle)
  bgCtx.globalCompositeOperation = "destination-in"
  bgCtx.drawImage(maskCanvas, 0, 0)
  bgCtx.globalCompositeOperation = "source-over"

  ctx.drawImage(bgCanvas, x, y)
}

function drawIconGlyph(
  ctx: import("@napi-rs/canvas").SKRSContext2D,
  iconSheet: Image,
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
  const drawX = prefixX + Math.floor((prefixW - w) / 2) + ICON_X_OFFSET
  const drawY = y + Math.floor((tileH - h) / 2)

  const shadowCanvas = newCanvas(w, h)
  const shadowCtx = shadowCanvas.getContext("2d")
  shadowCtx.drawImage(iconSheet, entry.x, entry.y, w, h, 0, 0, w, h)
  shadowCtx.globalCompositeOperation = "source-in"
  shadowCtx.fillStyle = "rgba(0,0,0,0.55)"
  shadowCtx.fillRect(0, 0, w, h)
  ctx.drawImage(shadowCanvas, drawX, drawY + 1)

  const glyphCanvas = newCanvas(w, h)
  const glyphCtx = glyphCanvas.getContext("2d")
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

  ctx.drawImage(glyphCanvas, drawX, drawY)
}

function drawTextGlyphs(
  ctx: import("@napi-rs/canvas").SKRSContext2D,
  fontSheet: Image,
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

    const shadowCanvas = newCanvas(CHAR_WIDTH, CHAR_HEIGHT)
    const shadowCtx = shadowCanvas.getContext("2d")
    shadowCtx.drawImage(fontSheet, fontChar.x, fontChar.y, CHAR_WIDTH, CHAR_HEIGHT, 0, 0, CHAR_WIDTH, CHAR_HEIGHT)
    shadowCtx.globalCompositeOperation = "source-in"
    shadowCtx.fillStyle = "rgba(0,0,0,0.55)"
    shadowCtx.fillRect(0, 0, CHAR_WIDTH, CHAR_HEIGHT)
    ctx.drawImage(shadowCanvas, cx + 1, textY + 1)

    const glyphCanvas = newCanvas(CHAR_WIDTH, CHAR_HEIGHT)
    const glyphCtx = glyphCanvas.getContext("2d")
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

    ctx.drawImage(glyphCanvas, cx + 1, textY)
  }
}

/**
 * Renders a `TagConfiguration` (the same shape the editor UI produces) to a PNG buffer.
 * Mirrors `renderRankTag` pixel-for-pixel: same composite operations, same offsets.
 */
export async function renderRankTagBuffer(config: TagConfiguration, style: RankTagStyle): Promise<Buffer> {
  const displayText = config.text || " "
  const tileH = style.tileHeight
  const leftW = style.leftWidth
  const rightW = style.rightWidth
  const midW = style.middleWidth
  const charCount = displayText.length
  const mainW = leftW + midW * charCount + rightW

  const iconEntry = config.iconId ? getIconEntry(config.iconId) : null
  const hasIconPrefix = Boolean(iconEntry)
  const iconPrefixW = hasIconPrefix ? ICON_BACKGROUND_WIDTH : 0
  const iconGap = hasIconPrefix ? ICON_TAG_GAP : 0
  const totalW = iconPrefixW + iconGap + mainW

  const canvas = newCanvas(totalW, tileH)
  const ctx = canvas.getContext("2d")
  ctx.imageSmoothingEnabled = false

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

  if (hasIconPrefix && config.iconId) {
    const [iconBgImg, iconSheet] = await Promise.all([
      getCachedImage(getIconBackgroundUrlServer(resolveIconStyleId(config.styleId, config.iconBgSync, config.iconStyleId))),
      getCachedImage(ICON_SHEET_PATH),
    ])
    drawTintedIconBackground(ctx, iconBgImg, 0, 0, iconColors)
    drawIconGlyph(ctx, iconSheet, config.iconId, 0, ICON_BACKGROUND_WIDTH, 0, ICON_BACKGROUND_HEIGHT, iconTintRgb)
    mainX = iconPrefixW + iconGap
  }

  const fontSheet = await getCachedImage(FONT_SHEET_PATH)
  drawTintedSegment(ctx, leftImg, midImg, rightImg, mainX, 0, style, charCount, tagColors)
  drawTextGlyphs(ctx, fontSheet, displayText, mainX, 0, style, textTintRgb)

  return canvas.toBuffer("image/png")
}
