/** Sprite atlas for prefix icons — place `icon_sheet.png` in `public/` (8×8 px cells). */
export const ICON_SHEET_URL = "/icon_sheet.png"

export const ICON_CELL_SIZE = 8

export interface IconSheetEntry {
  id: string
  name: string
  x: number
  y: number
}

/** Atlas coordinates; adjust if your sheet layout differs. */
export const ICON_MAP: Record<string, IconSheetEntry> = {
  crown: { id: "crown", name: "Crown", x: 0, y: 0 },
  sword: { id: "sword", name: "Sword", x: 8, y: 0 },
  shield: { id: "shield", name: "Shield", x: 16, y: 0 },
  star: { id: "star", name: "Star", x: 24, y: 0 },
  diamond: { id: "diamond", name: "Diamond", x: 32, y: 0 },
  heart: { id: "heart", name: "Heart", x: 40, y: 0 },
  skull: { id: "skull", name: "Skull", x: 48, y: 0 },
  fire: { id: "fire", name: "Fire", x: 56, y: 0 },
  gem: { id: "gem", name: "Gem", x: 64, y: 0 },
  axe: { id: "axe", name: "Axe", x: 72, y: 0 },
  bow: { id: "bow", name: "Bow", x: 80, y: 0 },
  key: { id: "key", name: "Key", x: 88, y: 0 },
  trophy: { id: "trophy", name: "Trophy", x: 96, y: 0 },
  medal: { id: "medal", name: "Medal", x: 104, y: 0 },
  potion: { id: "potion", name: "Potion", x: 112, y: 0 },
  wand: { id: "wand", name: "Wand", x: 120, y: 0 },
}

export const ICON_OPTIONS = Object.values(ICON_MAP).sort((a, b) =>
  a.name.localeCompare(b.name)
)

export function getIconEntry(iconId: string | null | undefined): IconSheetEntry | null {
  if (!iconId) return null
  return ICON_MAP[iconId] ?? null
}

export function getIconDisplayName(iconId: string | null | undefined): string | null {
  return getIconEntry(iconId)?.name ?? null
}
