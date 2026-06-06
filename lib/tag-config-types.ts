export type ColorMode = "solid" | "gradient"

export interface ColorSettings {
  colorMode: ColorMode
  color: string
  gradientStart: string
  gradientEnd: string
  gradientAngle: number
}

export interface TagConfiguration {
  text: string
  styleId: string
  colorMode: ColorMode
  color: string
  gradientStart: string
  gradientEnd: string
  gradientAngle: number
  iconId: string | null
  iconBgSync: boolean
  iconStyleId: string
  iconColorSync: boolean
  iconColorMode: ColorMode
  iconColor: string
  iconGradientStart: string
  iconGradientEnd: string
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
    gradientStart: config.gradientStart,
    gradientEnd: config.gradientEnd,
    gradientAngle: config.gradientAngle,
  }
}

export function getIconColorSettings(config: TagConfiguration): ColorSettings {
  if (config.iconColorSync) return getTagColorSettings(config)
  return {
    colorMode: config.iconColorMode,
    color: config.iconColor,
    gradientStart: config.iconGradientStart,
    gradientEnd: config.iconGradientEnd,
    gradientAngle: config.iconGradientAngle,
  }
}

export function tagConfigFromEntry(entry: TagConfiguration): TagConfiguration {
  return { ...entry }
}

export function configsEqual(a: TagConfiguration, b: TagConfiguration): boolean {
  return (
    a.text === b.text &&
    a.styleId === b.styleId &&
    a.colorMode === b.colorMode &&
    a.color === b.color &&
    a.gradientStart === b.gradientStart &&
    a.gradientEnd === b.gradientEnd &&
    a.gradientAngle === b.gradientAngle &&
    a.iconId === b.iconId &&
    a.iconBgSync === b.iconBgSync &&
    a.iconStyleId === b.iconStyleId &&
    a.iconColorSync === b.iconColorSync &&
    a.iconColorMode === b.iconColorMode &&
    a.iconColor === b.iconColor &&
    a.iconGradientStart === b.iconGradientStart &&
    a.iconGradientEnd === b.iconGradientEnd &&
    a.iconGradientAngle === b.iconGradientAngle
  )
}
