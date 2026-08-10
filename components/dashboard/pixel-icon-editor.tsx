"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Icon } from "@iconify/react"
import { useUndoable } from "@/lib/use-undoable"
import {
  getCustomIconDataUrl,
  getIconEntry,
  getLibraryIconRecordId,
  ICON_CELL_SIZE,
  ICON_OPTIONS,
  ICON_SHEET_URL,
  isCustomIconId,
  isLibraryIconId,
  makeLibraryIconId,
} from "@/lib/icon-sheet-config"
import type { CustomIconEntry, PublicIconEntry } from "@/lib/tag-config-types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const GRID_SIZE = 5
const CELL_PX = 44
const PRESET_COLORS = ["#ffffff", "#fbbf24", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#000000"]

type Grid = (string | null)[]
type PanelTab = "draw" | "presets" | "mine" | "community"

function emptyGrid(): Grid {
  return Array(GRID_SIZE * GRID_SIZE).fill(null)
}

/** Crops a built-in sprite icon out of the shared icon sheet as a standalone data URL. */
async function getPresetIconDataUrl(iconId: string): Promise<string | null> {
  const entry = getIconEntry(iconId)
  if (!entry) return null
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("load failed"))
      img.src = ICON_SHEET_URL
    })
    const canvas = document.createElement("canvas")
    canvas.width = entry.w
    canvas.height = entry.h
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, entry.x, entry.y, entry.w, entry.h, 0, 0, entry.w, entry.h)
    return canvas.toDataURL("image/png")
  } catch {
    return null
  }
}

async function resolveIconDataUrl(iconId: string): Promise<string | null> {
  if (isCustomIconId(iconId)) return getCustomIconDataUrl(iconId)
  if (isLibraryIconId(iconId)) {
    try {
      const res = await fetch(`/api/tag/custom-icons/${getLibraryIconRecordId(iconId)}`)
      if (!res.ok) return null
      const data = await res.json()
      return data.item.imageData as string
    } catch {
      return null
    }
  }
  return getPresetIconDataUrl(iconId)
}

/** Decodes an existing custom/library icon back into an editable pixel grid. */
async function gridFromIconId(iconId: string | null): Promise<Grid> {
  if (!iconId) return emptyGrid()
  const dataUrl = await resolveIconDataUrl(iconId)
  if (!dataUrl) return emptyGrid()
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("load failed"))
      img.src = dataUrl
    })

    // Decode at native size first.
    const srcCanvas = document.createElement("canvas")
    srcCanvas.width = img.naturalWidth
    srcCanvas.height = img.naturalHeight
    const srcCtx = srcCanvas.getContext("2d")
    if (!srcCtx) return emptyGrid()
    srcCtx.imageSmoothingEnabled = false
    srcCtx.drawImage(img, 0, 0)
    const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height).data

    // If the source is already GRID_SIZE x GRID_SIZE (re-editing one of our
    // own saved icons), decode it 1:1 — no trimming, so any intentional
    // empty margin the user drew is preserved exactly as-is.
    //
    // Otherwise (importing a built-in sprite, stored in a fixed-size sheet
    // cell like 8x8/8x7 whose actual artwork rarely fills it edge-to-edge),
    // trim to the tight non-transparent bounding box first — scaling the
    // padded cell down to GRID_SIZE would sample mostly blank margin and
    // visibly skew the result toward whichever edge has more padding.
    const needsTrim = srcCanvas.width !== GRID_SIZE || srcCanvas.height !== GRID_SIZE
    let boxX = 0
    let boxY = 0
    let boxW = srcCanvas.width
    let boxH = srcCanvas.height
    if (needsTrim) {
      let minX = srcCanvas.width, minY = srcCanvas.height, maxX = -1, maxY = -1
      for (let y = 0; y < srcCanvas.height; y++) {
        for (let x = 0; x < srcCanvas.width; x++) {
          if (srcData[(y * srcCanvas.width + x) * 4 + 3] > 10) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }
      if (maxX >= minX && maxY >= minY) {
        boxX = minX
        boxY = minY
        boxW = maxX - minX + 1
        boxH = maxY - minY + 1
      }
    }

    // Sample each grid cell from the center of its proportional region
    // within that tight box (not a plain scale-to-fit, which for non-square
    // ratios leaves the exact sampling grid up to the browser).
    const grid: Grid = []
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const sx = boxX + Math.min(boxW - 1, Math.floor(((gx + 0.5) * boxW) / GRID_SIZE))
        const sy = boxY + Math.min(boxH - 1, Math.floor(((gy + 0.5) * boxH) / GRID_SIZE))
        const i = (sy * srcCanvas.width + sx) * 4
        const a = srcData[i + 3]
        if (a < 10) {
          grid.push(null)
        } else {
          const r = srcData[i]
          const g = srcData[i + 1]
          const b = srcData[i + 2]
          grid.push(`#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`)
        }
      }
    }
    return grid
  } catch {
    return emptyGrid()
  }
}

interface PixelIconEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialIconId: string | null
  onSave: (iconId: string) => void
}

export default function PixelIconEditor({ open, onOpenChange, initialIconId, onSave }: PixelIconEditorProps) {
  const grid = useUndoable<Grid>(emptyGrid())
  const [tool, setTool] = useState<"pencil" | "eraser">("pencil")
  const [color, setColor] = useState("#fbbf24")
  const [painting, setPainting] = useState(false)
  const [iconName, setIconName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [panelTab, setPanelTab] = useState<PanelTab>("draw")
  const [myIcons, setMyIcons] = useState<CustomIconEntry[]>([])
  const [communityIcons, setCommunityIcons] = useState<PublicIconEntry[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [loadingBase, setLoadingBase] = useState(false)

  useEffect(() => {
    if (!open) return
    setPanelTab("draw")
    setIconName("")
    setError(null)
    gridFromIconId(initialIconId).then((g) => grid.load(g))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialIconId])

  const fetchMyIcons = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch("/api/tag/custom-icons")
      if (res.ok) {
        const data = await res.json()
        setMyIcons(data.items ?? [])
      }
    } finally {
      setLoadingList(false)
    }
  }, [])

  const fetchCommunityIcons = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch("/api/tag/custom-icons?public=true")
      if (res.ok) {
        const data = await res.json()
        setCommunityIcons(data.items ?? [])
      }
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    if (panelTab === "mine") fetchMyIcons()
    if (panelTab === "community") fetchCommunityIcons()
  }, [open, panelTab, fetchMyIcons, fetchCommunityIcons])

  /** Loads any existing icon (preset, own, or community) as a starting point in the Draw tab, ready to tweak and save as a new icon. */
  async function loadIconIntoDraw(iconId: string) {
    setLoadingBase(true)
    try {
      const g = await gridFromIconId(iconId)
      grid.load(g)
      setIconName("")
      setPanelTab("draw")
    } finally {
      setLoadingBase(false)
    }
  }

  function paintCell(index: number, next: Grid) {
    const value = tool === "eraser" ? null : color
    next[index] = value
  }

  function handlePointerDown(index: number) {
    setPainting(true)
    const next = [...grid.value]
    paintCell(index, next)
    grid.set(next)
  }

  function handlePointerEnter(index: number) {
    if (!painting) return
    const next = [...grid.value]
    paintCell(index, next)
    grid.set(next)
  }

  function handlePointerUp() {
    setPainting(false)
  }

  async function handleSaveDrawing() {
    const canvas = document.createElement("canvas")
    canvas.width = GRID_SIZE
    canvas.height = GRID_SIZE
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    for (let i = 0; i < grid.value.length; i++) {
      const c = grid.value[i]
      if (!c) continue
      const x = i % GRID_SIZE
      const y = Math.floor(i / GRID_SIZE)
      ctx.fillStyle = c
      ctx.fillRect(x, y, 1, 1)
    }
    const dataUrl = canvas.toDataURL("image/png")

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/tag/custom-icons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: iconName.trim() || "Untitled Icon", imageData: dataUrl }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? "Could not save icon")
        return
      }
      onSave(makeLibraryIconId(data.item.id))
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  function useIcon(id: string) {
    onSave(makeLibraryIconId(id))
    onOpenChange(false)
  }

  async function deleteMyIcon(id: string) {
    await fetch(`/api/tag/custom-icons?id=${id}`, { method: "DELETE" })
    setMyIcons((prev) => prev.filter((i) => i.id !== id))
  }

  async function toggleMyIconPublic(item: CustomIconEntry) {
    const nextPublic = !item.isPublic
    setError(null)
    setMyIcons((prev) => prev.map((i) => (i.id === item.id ? { ...i, isPublic: nextPublic } : i)))
    const res = await fetch("/api/tag/custom-icons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, isPublic: nextPublic }),
    })
    if (!res.ok) {
      setMyIcons((prev) => prev.map((i) => (i.id === item.id ? { ...i, isPublic: item.isPublic } : i)))
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Could not update icon")
    }
  }

  const hasAnyPixel = grid.value.some((c) => c !== null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onPointerUp={handlePointerUp} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Custom icon</DialogTitle>
          <DialogDescription>
            Draw from scratch, or base a new icon off a built-in icon, one of yours, or a community one — tweak it and save as your own.
          </DialogDescription>
        </DialogHeader>

        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--app-input-bg)] border border-[var(--app-border)] w-fit">
          {(["draw", "presets", "mine", "community"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setPanelTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                panelTab === t
                  ? "bg-[var(--app-brand)] text-black"
                  : "text-[var(--app-text)] hover:bg-[var(--app-surface-2)]"
              }`}
            >
              {t === "mine" ? "My Icons" : t === "community" ? "Community" : t === "presets" ? "Presets" : "Draw"}
            </button>
          ))}
        </div>

        {panelTab === "draw" && (
          <div className="flex flex-col items-center gap-3">
            <div
              className="grid border border-[var(--app-border)] rounded-md overflow-hidden select-none"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_PX}px)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_PX}px)`,
                backgroundImage:
                  "linear-gradient(45deg, #4a4a4a 25%, transparent 25%), linear-gradient(-45deg, #4a4a4a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #4a4a4a 75%), linear-gradient(-45deg, transparent 75%, #4a4a4a 75%)",
                backgroundSize: `${CELL_PX / 2}px ${CELL_PX / 2}px`,
                backgroundPosition: `0 0, 0 ${CELL_PX / 4}px, ${CELL_PX / 4}px -${CELL_PX / 4}px, -${CELL_PX / 4}px 0px`,
                backgroundColor: "#2e2e2e",
              }}
              onPointerLeave={() => setPainting(false)}
            >
              {grid.value.map((cellColor, i) => (
                <div
                  key={i}
                  onPointerDown={() => handlePointerDown(i)}
                  onPointerEnter={() => handlePointerEnter(i)}
                  className="border border-black/10 cursor-crosshair"
                  style={{ backgroundColor: cellColor ?? "transparent" }}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 w-full">
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--app-input-bg)] border border-[var(--app-border)]">
                <button
                  onClick={() => setTool("pencil")}
                  title="Pencil"
                  className={`p-2 rounded-lg transition-all ${
                    tool === "pencil" ? "bg-[var(--app-brand)] text-black" : "text-[var(--app-text)] hover:bg-[var(--app-surface-2)]"
                  }`}
                >
                  <Icon icon="mdi:pencil" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTool("eraser")}
                  title="Eraser"
                  className={`p-2 rounded-lg transition-all ${
                    tool === "eraser" ? "bg-[var(--app-brand)] text-black" : "text-[var(--app-text)] hover:bg-[var(--app-surface-2)]"
                  }`}
                >
                  <Icon icon="mdi:eraser" className="w-4 h-4" />
                </button>
              </div>

              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border border-[rgba(120,80,10,0.12)] bg-transparent p-0.5"
                title="Pick a color"
              />

              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setColor(preset)}
                    title={preset}
                    className={`w-6 h-6 rounded-md border-2 transition-all ${
                      color === preset ? "border-white scale-110" : "border-transparent hover:border-white/40"
                    }`}
                    style={{ backgroundColor: preset }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={grid.undo}
                disabled={!grid.canUndo}
                title="Undo"
                className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-input-bg)]
                  disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <Icon icon="mdi:undo" className="w-4 h-4" />
              </button>
              <button
                onClick={grid.redo}
                disabled={!grid.canRedo}
                title="Redo"
                className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-input-bg)]
                  disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <Icon icon="mdi:redo" className="w-4 h-4" />
              </button>
              <button
                onClick={() => grid.set(emptyGrid())}
                title="Clear all"
                className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-red-400 hover:bg-[var(--app-input-bg)] transition-all"
              >
                <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              placeholder="Icon name (optional)"
              maxLength={40}
              className="w-full px-3 py-2 rounded-lg bg-[var(--app-input-bg)] border border-[var(--app-border)]
                text-[var(--app-text)] text-sm placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--app-brand)]"
            />
          </div>
        )}

        {panelTab === "presets" && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[var(--app-text-muted)]">
              Pick one to load into the Draw tab as a starting point — tweak it, then save as your own icon.
            </p>
            {loadingBase ? (
              <div className="flex items-center gap-2 text-[var(--app-text-cream)] text-sm py-6 justify-center">
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin text-[var(--app-brand)]" />
                Loading...
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => loadIconIntoDraw(opt.id)}
                    title={`Base a new icon off ${opt.name}`}
                    className="flex items-center justify-center aspect-square rounded-lg bg-[#1a1a1a] border border-[var(--app-border)]
                      hover:border-[var(--app-brand)] transition-all"
                  >
                    <div
                      style={{
                        width: opt.w * 3,
                        height: opt.h * 3,
                        backgroundImage: `url(${ICON_SHEET_URL})`,
                        backgroundPosition: `-${opt.x * 3}px -${opt.y * 3}px`,
                        backgroundSize: `${125 * 3}px ${15 * 3}px`,
                        imageRendering: "pixelated",
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {panelTab === "mine" && (
          <IconList
            items={myIcons}
            loading={loadingList}
            emptyLabel="No saved icons yet. Draw one to get started."
            onUse={(id) => useIcon(id)}
            renderActions={(item) => (
              <>
                <button
                  onClick={() => loadIconIntoDraw(makeLibraryIconId(item.id))}
                  title="Edit as new icon"
                  className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text)] transition-all"
                >
                  <Icon icon="mdi:pencil-outline" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleMyIconPublic(item)}
                  title={item.isPublic ? "Public — click to make private" : "Private — click to make public"}
                  className={`p-1.5 rounded-lg transition-all ${
                    item.isPublic ? "text-[var(--app-brand)]" : "text-[var(--app-text-muted)] hover:text-[var(--app-text)]"
                  }`}
                >
                  <Icon icon={item.isPublic ? "mdi:earth" : "mdi:lock-outline"} className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteMyIcon(item.id)}
                  title="Delete"
                  className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-red-400 transition-all"
                >
                  <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                </button>
              </>
            )}
          />
        )}

        {panelTab === "community" && (
          <IconList
            items={communityIcons}
            loading={loadingList}
            emptyLabel="No public icons yet. Make one of yours public from My Icons."
            onUse={(id) => useIcon(id)}
            renderSubtitle={(item) => `by ${item.authorName}`}
            renderActions={(item) => (
              <button
                onClick={() => loadIconIntoDraw(makeLibraryIconId(item.id))}
                title="Edit as new icon"
                className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text)] transition-all"
              >
                <Icon icon="mdi:pencil-outline" className="w-4 h-4" />
              </button>
            )}
          />
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--app-input-bg)] text-[var(--app-text)]
              border border-[var(--app-border)] hover:bg-[var(--app-surface-2)] transition-all"
          >
            Cancel
          </button>
          {panelTab === "draw" && (
            <button
              onClick={handleSaveDrawing}
              disabled={!hasAnyPixel || saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-black bg-[var(--app-brand)]
                hover:bg-[var(--app-brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? "Saving..." : "Save & Use"}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function IconList<T extends CustomIconEntry>({
  items,
  loading,
  emptyLabel,
  onUse,
  renderActions,
  renderSubtitle,
}: {
  items: T[]
  loading: boolean
  emptyLabel: string
  onUse: (id: string) => void
  renderActions?: (item: T) => React.ReactNode
  renderSubtitle?: (item: T) => string
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[var(--app-text-cream)] text-sm py-6 justify-center">
        <Icon icon="mdi:loading" className="w-4 h-4 animate-spin text-[var(--app-brand)]" />
        Loading...
      </div>
    )
  }

  if (items.length === 0) {
    return <p className="text-sm text-[var(--app-text-muted)] py-6 text-center">{emptyLabel}</p>
  }

  return (
    <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] p-2"
        >
          <div className="shrink-0 w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[var(--app-border)] flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageData} alt={item.name} className="w-6 h-6" style={{ imageRendering: "pixelated" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--app-text)] truncate">{item.name}</p>
            {renderSubtitle && <p className="text-xs text-[var(--app-text-muted)] mt-0.5">{renderSubtitle(item)}</p>}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {renderActions?.(item)}
            <button
              onClick={() => onUse(item.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--app-input-bg)] text-[var(--app-text)]
                border border-[var(--app-border)] hover:bg-[var(--app-surface-2)] hover:border-[var(--app-brand)] transition-all"
            >
              Use
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
