export const MIN_GRADIENT_COLORS = 2
export const MAX_GRADIENT_COLORS = 6

export const DEFAULT_GRADIENT_COLORS = ["#0051FF", "#FFFFFF"]

export function randomHexColor(): string {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0")}`
}

export function randomGradientColors(
  count = Math.floor(Math.random() * 3) + 2
): string[] {
  const n = Math.min(MAX_GRADIENT_COLORS, Math.max(MIN_GRADIENT_COLORS, count))
  return Array.from({ length: n }, () => randomHexColor())
}

export function normalizeGradientColors(colors: string[] | null | undefined): string[] {
  if (!colors || colors.length < MIN_GRADIENT_COLORS) return [...DEFAULT_GRADIENT_COLORS]
  return colors.slice(0, MAX_GRADIENT_COLORS).map((c) => c || "#000000")
}

export function parseGradientColorsFromRow(
  row: Record<string, unknown>,
  prefix: "" | "icon_" = ""
): string[] {
  const jsonKey = `${prefix}gradient_colors`
  const raw = row[jsonKey]
  if (raw) {
    try {
      const parsed = JSON.parse(String(raw))
      if (Array.isArray(parsed) && parsed.length >= MIN_GRADIENT_COLORS) {
        return normalizeGradientColors(parsed.map(String))
      }
    } catch {
      // fall through to legacy columns
    }
  }

  return normalizeGradientColors([
    String(row[`${prefix}gradient_start`] ?? DEFAULT_GRADIENT_COLORS[0]),
    String(row[`${prefix}gradient_end`] ?? DEFAULT_GRADIENT_COLORS[1]),
  ])
}

export function gradientColorsToJson(colors: string[]): string {
  return JSON.stringify(normalizeGradientColors(colors))
}

export function averageGradientRgb(colors: string[]): { r: number; g: number; b: number } {
  const normalized = normalizeGradientColors(colors)
  let r = 0
  let g = 0
  let b = 0

  for (const hex of normalized) {
    r += parseInt(hex.slice(1, 3), 16)
    g += parseInt(hex.slice(3, 5), 16)
    b += parseInt(hex.slice(5, 7), 16)
  }

  const n = normalized.length
  return {
    r: Math.round(r / n),
    g: Math.round(g / n),
    b: Math.round(b / n),
  }
}

export function applyMultiGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  colors: string[],
  angle: number
) {
  const stops = normalizeGradientColors(colors)
  const centerX = x + w / 2
  const centerY = y + h / 2
  const rad = (angle * Math.PI) / 180
  const halfDiagonal = Math.sqrt(w * w + h * h) / 2
  const dx = Math.cos(rad) * halfDiagonal
  const dy = Math.sin(rad) * halfDiagonal

  const gradient = ctx.createLinearGradient(centerX - dx, centerY - dy, centerX + dx, centerY + dy)
  stops.forEach((hex, i) => {
    const t = stops.length === 1 ? 0 : i / (stops.length - 1)
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    gradient.addColorStop(t, `rgb(${r}, ${g}, ${b})`)
  })

  ctx.fillStyle = gradient
  ctx.fillRect(x, y, w, h)
}
