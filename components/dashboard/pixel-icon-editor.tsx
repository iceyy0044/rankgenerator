"use client"

import { useEffect, useRef, useState } from "react"
import { useUndoable } from "@/lib/use-undoable"
import { isCustomIconId, getCustomIconDataUrl, makeCustomIconId } from "@/lib/icon-sheet-config"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const GRID_SIZE = 8
const CELL_PX = 28
const PRESET_COLORS = ["#ffffff", "#fbbf24", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#000000"]

type Grid = (string | null)[]

function emptyGrid(): Grid {
  return Array(GRID_SIZE * GRID_SIZE).fill(null)
}

/** Decodes an existing `custom:<data-url>` icon back into an editable pixel grid. */
async function gridFromIconId(iconId: string | null): Promise<Grid> {
  if (!iconId || !isCustomIconId(iconId)) return emptyGrid()
  try {
    const dataUrl = getCustomIconDataUrl(iconId)
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("load failed"))
      img.src = dataUrl
    })
    const canvas = document.createElement("canvas")
    canvas.width = GRID_SIZE
    canvas.height = GRID_SIZE
    const ctx = canvas.getContext("2d")
    if (!ctx) return emptyGrid()
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, 0, 0, GRID_SIZE, GRID_SIZE)
    const data = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE).data
    const grid: Grid = []
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const a = data[i * 4 + 3]
      if (a < 10) {
        grid.push(null)
      } else {
        const r = data[i * 4]
        const g = data[i * 4 + 1]
        const b = data[i * 4 + 2]
        grid.push(`#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`)
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
  const strokeStartRef = useRef<Grid | null>(null)

  useEffect(() => {
    if (!open) return
    gridFromIconId(initialIconId).then((g) => grid.load(g))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialIconId])

  function paintCell(index: number, next: Grid) {
    const value = tool === "eraser" ? null : color
    next[index] = value
  }

  function handlePointerDown(index: number) {
    setPainting(true)
    strokeStartRef.current = [...grid.value]
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
    strokeStartRef.current = null
  }

  function handleSave() {
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
    onSave(makeCustomIconId(dataUrl))
    onOpenChange(false)
  }

  const hasAnyPixel = grid.value.some((c) => c !== null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onPointerUp={handlePointerUp} className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Draw a custom icon</DialogTitle>
          <DialogDescription>{GRID_SIZE}×{GRID_SIZE} pixels. Click and drag to paint.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <div
            className="grid border border-[var(--app-border)] rounded-md overflow-hidden select-none"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_PX}px)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_PX}px)`,
              backgroundImage:
                "linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)",
              backgroundSize: `${CELL_PX / 2}px ${CELL_PX / 2}px`,
              backgroundPosition: `0 0, 0 ${CELL_PX / 4}px, ${CELL_PX / 4}px -${CELL_PX / 4}px, -${CELL_PX / 4}px 0px`,
              backgroundColor: "#c0c0c0",
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
                <span className="iconify w-4 h-4" data-icon="mdi:pencil" />
              </button>
              <button
                onClick={() => setTool("eraser")}
                title="Eraser"
                className={`p-2 rounded-lg transition-all ${
                  tool === "eraser" ? "bg-[var(--app-brand)] text-black" : "text-[var(--app-text)] hover:bg-[var(--app-surface-2)]"
                }`}
              >
                <span className="iconify w-4 h-4" data-icon="mdi:eraser" />
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
              <span className="iconify w-4 h-4" data-icon="mdi:undo" />
            </button>
            <button
              onClick={grid.redo}
              disabled={!grid.canRedo}
              title="Redo"
              className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-input-bg)]
                disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <span className="iconify w-4 h-4" data-icon="mdi:redo" />
            </button>
            <button
              onClick={() => grid.set(emptyGrid())}
              title="Clear all"
              className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-red-400 hover:bg-[var(--app-input-bg)] transition-all"
            >
              <span className="iconify w-4 h-4" data-icon="mdi:trash-can-outline" />
            </button>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--app-input-bg)] text-[var(--app-text)]
              border border-[var(--app-border)] hover:bg-[var(--app-surface-2)] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasAnyPixel}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-black bg-[var(--app-brand)]
              hover:bg-[var(--app-brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Use this icon
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
