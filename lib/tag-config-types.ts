import { normalizeGradientColors } from "@/lib/gradient-utils"

export const MAX_TAG_TEXT_LENGTH = 30

export type ColorMode = "solid" | "gradient"

export interface ColorSettings {
  colorMode: ColorMode
  color: string
  gradientColors: string[]
  gradientAngle: number
}

export interface TagConfiguration {
  text: string
  styleId: string
  colorMode: ColorMode
  color: string
  gradientColors: string[]
  gradientAngle: number
  iconId: string | null
  iconBgSync: boolean
  iconStyleId: string
  iconColorSync: boolean
  iconColorMode: ColorMode
  iconColor: string
  iconGradientColors: string[]
  iconGradientAngle: number
}

export interface TagHistoryEntry extends TagConfiguration {
  id: string
  created_at: string
}

export interface TagFavouriteEntry extends TagConfiguration {
  id: string
  name: string | null
  created_at: string
}

export function getTagColorSettings(config: TagConfiguration): ColorSettings {
  return {
    colorMode: config.colorMode,
    color: config.color,
    gradientColors: normalizeGradientColors(config.gradientColors),
    gradientAngle: config.gradientAngle,
  }
}

export function getIconColorSettings(config: TagConfiguration): ColorSettings {
  if (config.iconColorSync) return getTagColorSettings(config)
  return {
    colorMode: config.iconColorMode,
    color: config.iconColor,
    gradientColors: normalizeGradientColors(config.iconGradientColors),
    gradientAngle: config.iconGradientAngle,
  }
}

export function tagConfigFromEntry(entry: TagConfiguration): TagConfiguration {
  return { ...entry }
}

function gradientColorsEqual(a: string[], b: string[]): boolean {
  const na = normalizeGradientColors(a)
  const nb = normalizeGradientColors(b)
  if (na.length !== nb.length) return false
  return na.every((c, i) => c === nb[i])
}

export function configsEqual(a: TagConfiguration, b: TagConfiguration): boolean {
  return (
    a.text === b.text &&
    a.styleId === b.styleId &&
    a.colorMode === b.colorMode &&
    a.color === b.color &&
    gradientColorsEqual(a.gradientColors, b.gradientColors) &&
    a.gradientAngle === b.gradientAngle &&
    a.iconId === b.iconId &&
    a.iconBgSync === b.iconBgSync &&
    a.iconStyleId === b.iconStyleId &&
    a.iconColorSync === b.iconColorSync &&
    a.iconColorMode === b.iconColorMode &&
    a.iconColor === b.iconColor &&
    gradientColorsEqual(a.iconGradientColors, b.iconGradientColors) &&
    a.iconGradientAngle === b.iconGradientAngle
  )
}
