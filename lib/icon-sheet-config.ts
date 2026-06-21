/** Sprite atlas for prefix icons — `public/icon_sheet.png` (125×15 px, 8 px columns). */
export const ICON_SHEET_URL = "/icon_sheet.png"

export const ICON_CELL_SIZE = 8

/** Gap between the icon prefix box and the main rank tag (px). */
export const ICON_TAG_GAP = 3

/** Extra horizontal offset when drawing icons (+1 px right of font glyph alignment). */
export const ICON_X_OFFSET = 2

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

/** Row 0 left-to-right, then row 1 — matches icon sheet layout. */
const ICON_SHEET_ICONS: IconSheetEntry[] = [
  cell(0, 0, "squires", "Squires"),
  cell(1, 0, "crown", "Crown"),
  cell(2, 0, "crown2", "Crown2"),
  cell(3, 0, "information_mark", "Information Mark"),
  cell(4, 0, "computer", "Computer"),
  cell(5, 0, "hammer", "Hammer"),
  cell(6, 0, "crystal", "Crystal"),
  cell(7, 0, "bubble", "Bubble"),
  cell(8, 0, "star", "Star"),
  cell(9, 0, "play_button", "Play Button"),
  cell(10, 0, "shield", "Shield"),
  cell(11, 0, "user", "User"),
  cell(12, 0, "cup", "Cup"),
  cell(13, 0, "shield2", "Shield2"),
  cell(14, 0, "shield3", "Shield3"),

  cell(0, 1, "chestplate", "Chestplate"),
  cell(1, 1, "chestplate2", "Crate 3"),
  cell(2, 1, "crate", "Crate"),
  cell(3, 1, "crate2", "Crate2"),
  cell(4, 1, "crate3", "Circle"),
  cell(5, 1, "circle", "Star"),
  cell(6, 1, "house", "Heart"),
  cell(7, 1, "heart", "Question Mark"),
  cell(8, 1, "question_mark", "Skull"),
  cell(9, 1, "skull", "Compass"),
  cell(10, 1, "compass", "Gear"),
]

/** Maps legacy icon ids from saved tags to current ids (same sheet position). */
const LEGACY_ICON_IDS: Record<string, string> = {
  dots: "squires",
  royal: "crown2",
  info: "information_mark",
  monitor: "computer",
  diamond: "crystal",
  cloud: "bubble",
  duo: "star",
  play: "play_button",
  chest: "shield2",
  wings: "shield3",
  wings_down: "chestplate",
  shield_alt: "chestplate2",
  castle: "crate",
  hourglass: "crate2",
  trident: "crate3",
  sun: "circle",
  legs: "house",
  question: "question_mark",
  gem: "compass",
  target: "gear",
}

export const ICON_MAP: Record<string, IconSheetEntry> = Object.fromEntries(
  ICON_SHEET_ICONS.map((entry) => [entry.id, entry])
)

/** Dropdown order: left-to-right on the sheet (row 0, then row 1). */
export const ICON_OPTIONS = ICON_SHEET_ICONS

function resolveIconId(iconId: string): string {
  return LEGACY_ICON_IDS[iconId] ?? iconId
}

export function normalizeIconId(iconId: string | null | undefined): string | null {
  if (!iconId) return null
  const resolved = resolveIconId(iconId)
  return ICON_MAP[resolved] ? resolved : null
}

export function getIconEntry(iconId: string | null | undefined): IconSheetEntry | null {
  if (!iconId) return null
  return ICON_MAP[resolveIconId(iconId)] ?? null
}

export function getIconDisplayName(iconId: string | null | undefined): string | null {
  return getIconEntry(iconId)?.name ?? null
}
