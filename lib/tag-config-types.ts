export type ColorMode = "solid" | "gradient"

export interface TagConfiguration {
  text: string
  styleId: string
  colorMode: ColorMode
  color: string
  gradientStart: string
  gradientEnd: string
  gradientAngle: number
  iconEnabled: boolean
  iconUrl: string | null
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

export function tagConfigFromEntry(entry: TagConfiguration): TagConfiguration {
  return {
    text: entry.text,
    styleId: entry.styleId,
    colorMode: entry.colorMode,
    color: entry.color,
    gradientStart: entry.gradientStart,
    gradientEnd: entry.gradientEnd,
    gradientAngle: entry.gradientAngle,
    iconEnabled: entry.iconEnabled,
    iconUrl: entry.iconUrl,
  }
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
    a.iconEnabled === b.iconEnabled &&
    a.iconUrl === b.iconUrl
  )
}
