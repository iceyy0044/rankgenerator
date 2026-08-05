"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getIconDisplayName } from "@/lib/icon-sheet-config"
import { RANK_TAG_STYLES } from "@/lib/rank-tag-config"
import type { TagConfiguration, TagFavouriteEntry, TagHistoryEntry } from "@/lib/tag-config-types"
import TagThumbnail from "@/components/dashboard/tag-thumbnail"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Tab = "history" | "favourites"

interface TagSavedPanelProps {
  onLoadConfig: (config: TagConfiguration) => void
  refreshKey?: number
  fullPage?: boolean
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function entryLabel(entry: TagConfiguration) {
  const parts = [entry.text || "(empty)"]
  const iconName = getIconDisplayName(entry.iconId)
  if (iconName) parts.push(`+ ${iconName}`)
  return parts.join(" ")
}

function styleName(styleId: string) {
  return RANK_TAG_STYLES.find((s) => s.id === styleId)?.name ?? styleId
}

function matchesQuery(entry: TagConfiguration & { name?: string | null }, query: string) {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  const haystack = [
    entry.name ?? "",
    entry.text,
    styleName(entry.styleId),
    getIconDisplayName(entry.iconId) ?? "",
    entry.color,
    ...entry.gradientColors,
  ]
    .join(" ")
    .toLowerCase()
  return haystack.includes(q)
}

export default function TagSavedPanel({ onLoadConfig, refreshKey = 0, fullPage = false }: TagSavedPanelProps) {
  const [tab, setTab] = useState<Tab>("history")
  const [history, setHistory] = useState<TagHistoryEntry[]>([])
  const [favourites, setFavourites] = useState<TagFavouriteEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [savingFav, setSavingFav] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [pendingDelete, setPendingDelete] = useState<{ tab: Tab; id: string; label: string } | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const lastPendingDeleteRef = useRef<typeof pendingDelete>(null)
  if (pendingDelete) lastPendingDeleteRef.current = pendingDelete
  const deleteDialogData = pendingDelete ?? lastPendingDeleteRef.current

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [historyRes, favRes] = await Promise.all([
        fetch("/api/tag/history"),
        fetch("/api/tag/favourites"),
      ])

      if (historyRes.ok) {
        const data = await historyRes.json()
        setHistory(data.items ?? [])
      }
      if (favRes.ok) {
        const data = await favRes.json()
        setFavourites(data.items ?? [])
      }
    } catch {
      setError("Could not load saved tags")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll, refreshKey])

  async function deleteHistory(id: string) {
    await fetch(`/api/tag/history?id=${id}`, { method: "DELETE" })
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }

  async function deleteFavourite(id: string) {
    await fetch(`/api/tag/favourites?id=${id}`, { method: "DELETE" })
    setFavourites((prev) => prev.filter((item) => item.id !== id))
  }

  async function saveFavourite(config: TagConfiguration, name?: string) {
    setSavingFav(true)
    try {
      const res = await fetch("/api/tag/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, name }),
      })
      if (res.ok) {
        const data = await res.json()
        setFavourites((prev) => [data.item, ...prev])
      }
    } finally {
      setSavingFav(false)
    }
  }

  async function duplicateFavourite(item: TagFavouriteEntry) {
    const baseName = item.name || entryLabel(item)
    await saveFavourite(item, `${baseName} (copy)`)
  }

  async function renameFavourite(id: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) {
      setRenamingId(null)
      return
    }
    const res = await fetch("/api/tag/favourites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: trimmed }),
    })
    if (res.ok) {
      const data = await res.json()
      setFavourites((prev) => prev.map((f) => (f.id === id ? data.item : f)))
    }
    setRenamingId(null)
  }

  function confirmDelete() {
    if (!pendingDelete) return
    if (pendingDelete.tab === "history") deleteHistory(pendingDelete.id)
    else deleteFavourite(pendingDelete.id)
    setPendingDelete(null)
  }

  const filteredHistory = useMemo(() => history.filter((item) => matchesQuery(item, query)), [history, query])
  const filteredFavourites = useMemo(() => favourites.filter((item) => matchesQuery(item, query)), [favourites, query])

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
      {!fullPage && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--app-text)] tracking-tight">History & Favourites</h2>
          <p className="text-xs text-[var(--app-text-muted)] mt-1">
            Downloads are saved to history. Star tags you want to keep.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("history")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "history"
                ? "bg-[var(--app-brand)] text-black"
                : "bg-[var(--app-input-bg)] text-[var(--app-text)] hover:bg-[var(--app-surface-2)]"
            }`}
          >
            History
          </button>
          <button
            onClick={() => setTab("favourites")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "favourites"
                ? "bg-[var(--app-brand)] text-black"
                : "bg-[var(--app-input-bg)] text-[var(--app-text)] hover:bg-[var(--app-surface-2)]"
            }`}
          >
            Favourites
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs sm:ml-auto">
          <span
            className="iconify w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)]"
            data-icon="mdi:magnify"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, style, icon, colour..."
            className="w-full pl-9 pr-8 py-2 rounded-lg bg-[var(--app-input-bg)] border border-[var(--app-border)]
              text-[var(--app-text)] text-sm placeholder:text-[var(--app-text-muted)] focus:outline-none
              focus:border-[var(--app-brand)] transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--app-text-muted)] hover:text-[var(--app-text)]"
              title="Clear search"
            >
              <span className="iconify w-3.5 h-3.5" data-icon="mdi:close" />
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--app-text-cream)] text-sm py-4">
          <span className="iconify w-4 h-4 animate-spin text-[var(--app-brand)]" data-icon="mdi:loading" />
          Loading...
        </div>
      ) : tab === "history" ? (
        history.length === 0 ? (
          <p className="text-sm text-[var(--app-text-muted)] py-4">No history yet. Download a tag to save it here.</p>
        ) : filteredHistory.length === 0 ? (
          <p className="text-sm text-[var(--app-text-muted)] py-4">No history entries match &ldquo;{query}&rdquo;.</p>
        ) : (
          <ul className={`flex flex-col gap-2 overflow-y-auto ${fullPage ? "max-h-[calc(100vh-18rem)]" : "max-h-64"}`}>
            {filteredHistory.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] p-3"
              >
                <div className="shrink-0 rounded-lg bg-[var(--app-preview-bg)] border border-[var(--app-border)] p-1.5 flex items-center justify-center">
                  <TagThumbnail config={item} scale={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--app-text)] truncate">{entryLabel(item)}</p>
                  <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                    {styleName(item.styleId)} · {formatDate(item.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onLoadConfig(item)}
                    title="Load into generator"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                      bg-[var(--app-input-bg)] text-[var(--app-text)] border border-[var(--app-border)]
                      hover:bg-[var(--app-surface-2)] hover:border-[var(--app-brand)] transition-all"
                  >
                    <span className="iconify w-3.5 h-3.5" data-icon="mdi:pencil" />
                    Load
                  </button>
                  <button
                    onClick={() => saveFavourite(item)}
                    disabled={savingFav}
                    title="Add to favourites"
                    className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-brand)] hover:bg-[var(--app-input-bg)] transition-all"
                  >
                    <span className="iconify w-4 h-4" data-icon="mdi:star-outline" />
                  </button>
                  <button
                    onClick={() => setPendingDelete({ tab: "history", id: item.id, label: entryLabel(item) })}
                    title="Remove from history"
                    className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-red-400 hover:bg-[var(--app-input-bg)] transition-all"
                  >
                    <span className="iconify w-4 h-4" data-icon="mdi:trash-can-outline" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : favourites.length === 0 ? (
        <p className="text-sm text-[var(--app-text-muted)] py-4">No favourites yet. Star a tag to save it here.</p>
      ) : filteredFavourites.length === 0 ? (
        <p className="text-sm text-[var(--app-text-muted)] py-4">No favourites match &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className={`flex flex-col gap-2 overflow-y-auto ${fullPage ? "max-h-[calc(100vh-18rem)]" : "max-h-64"}`}>
          {filteredFavourites.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] p-3"
            >
              <div className="shrink-0 rounded-lg bg-[var(--app-preview-bg)] border border-[var(--app-border)] p-1.5 flex items-center justify-center">
                <TagThumbnail config={item} scale={3} />
              </div>
              <div className="flex-1 min-w-0">
                {renamingId === item.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renameFavourite(item.id, renameValue)
                      if (e.key === "Escape") setRenamingId(null)
                    }}
                    onBlur={() => renameFavourite(item.id, renameValue)}
                    className="w-full px-2 py-1 rounded-md bg-[var(--app-input-bg)] border border-[var(--app-brand)]
                      text-sm text-[var(--app-text)] focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[var(--app-text)] truncate">
                    {item.name || entryLabel(item)}
                  </p>
                )}
                <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                  {item.text} · {styleName(item.styleId)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onLoadConfig(item)}
                  title="Load into generator"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                    bg-[var(--app-input-bg)] text-[var(--app-text)] border border-[var(--app-border)]
                    hover:bg-[var(--app-surface-2)] hover:border-[var(--app-brand)] transition-all"
                >
                  <span className="iconify w-3.5 h-3.5" data-icon="mdi:pencil" />
                  Load
                </button>
                <button
                  onClick={() => {
                    setRenamingId(item.id)
                    setRenameValue(item.name || entryLabel(item))
                  }}
                  title="Rename"
                  className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-input-bg)] transition-all"
                >
                  <span className="iconify w-4 h-4" data-icon="mdi:rename-box" />
                </button>
                <button
                  onClick={() => duplicateFavourite(item)}
                  disabled={savingFav}
                  title="Duplicate"
                  className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-input-bg)] transition-all"
                >
                  <span className="iconify w-4 h-4" data-icon="mdi:content-copy" />
                </button>
                <button
                  onClick={() =>
                    setPendingDelete({ tab: "favourites", id: item.id, label: item.name || entryLabel(item) })
                  }
                  title="Remove favourite"
                  className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-red-400 hover:bg-[var(--app-input-bg)] transition-all"
                >
                  <span className="iconify w-4 h-4" data-icon="mdi:trash-can-outline" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteDialogData?.label}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialogData?.tab === "favourites"
                ? "This favourite will be permanently removed. This can't be undone."
                : "This history entry will be permanently removed. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 text-white hover:bg-red-600 focus:ring-red-400"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export async function saveTagToHistory(config: TagConfiguration) {
  try {
    await fetch("/api/tag/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    })
  } catch {
    // Non-blocking
  }
}

export async function saveTagToFavourites(config: TagConfiguration, name?: string) {
  const res = await fetch("/api/tag/favourites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...config, name }),
  })
  if (!res.ok) throw new Error("Failed to save favourite")
  const data = await res.json()
  return data.item as TagFavouriteEntry
}
