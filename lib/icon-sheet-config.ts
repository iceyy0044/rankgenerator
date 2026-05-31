/** Sprite atlas for prefix icons — `public/icon_sheet.png` (125×15 px, 8 px columns). */
export const ICON_SHEET_URL = "/icon_sheet.png"

export const ICON_CELL_SIZE = 8

/** Gap between the icon prefix box and the main rank tag (px). */
export const ICON_TAG_GAP = 3

export interface IconSheetEntry {
  id: string
  name: string
  x: number
  y: number
  w: number
  h: number
}

function cell(col: number, row: number, id: string, name: string): IconSheetEntry {
  return {
    id,
    name,
    x: col * ICON_CELL_SIZE,
    y: row * ICON_CELL_SIZE,
    w: ICON_CELL_SIZE,
    h: row === 0 ? ICON_CELL_SIZE : 7,
  }
}

/** Row 0 (y=0) left-to-right, then row 1 (y=8). Matches the provided icon sheet layout. */
export const ICON_MAP: Record<string, IconSheetEntry> = {
  dots: cell(0, 0, "dots", "Dots"),
  crown: cell(1, 0, "crown", "Crown"),
  royal: cell(2, 0, "royal", "Royal"),
  info: cell(3, 0, "info", "Info"),
  monitor: cell(4, 0, "monitor", "Monitor"),
  hammer: cell(5, 0, "hammer", "Hammer"),
  diamond: cell(6, 0, "diamond", "Diamond"),
  cloud: cell(7, 0, "cloud", "Cloud"),
  duo: cell(8, 0, "duo", "Duo"),
  play: cell(9, 0, "play", "Play"),
  shield: cell(10, 0, "shield", "Shield"),
  user: cell(11, 0, "user", "User"),
  cup: cell(12, 0, "cup", "Cup"),
  chest: cell(13, 0, "chest", "Chest"),
  wings: cell(14, 0, "wings", "Wings"),

  wings_down: cell(0, 1, "wings_down", "Wings Down"),
  shield_alt: cell(1, 1, "shield_alt", "Shield Alt"),
  castle: cell(2, 1, "castle", "Castle"),
  hourglass: cell(3, 1, "hourglass", "Hourglass"),
  trident: cell(4, 1, "trident", "Trident"),
  sun: cell(5, 1, "sun", "Sun"),
  legs: cell(6, 1, "legs", "Legs"),
  heart: cell(7, 1, "heart", "Heart"),
  question: cell(8, 1, "question", "Question"),
  skull: cell(9, 1, "skull", "Skull"),
  gem: cell(10, 1, "gem", "Gem"),
  target: cell(11, 1, "target", "Target"),
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
