"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Icon } from "@iconify/react"
import { getIconDisplayName } from "@/lib/icon-sheet-config"
import { RANK_TAG_STYLES } from "@/lib/rank-tag-config"
import type {
  PublicTagEntry,
  TagConfiguration,
  TagFavouriteEntry,
  TagFavouriteFolder,
  TagHistoryEntry,
} from "@/lib/tag-config-types"
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

type Tab = "history" | "favourites" | "community"
type FolderFilter = "all" | "none" | string

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
  const [folders, setFolders] = useState<TagFavouriteFolder[]>([])
  const [activeFolder, setActiveFolder] = useState<FolderFilter>("all")
  const [loading, setLoading] = useState(true)
  const [savingFav, setSavingFav] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [pendingDelete, setPendingDelete] = useState<{ tab: Tab; id: string; label: string } | null>(null)
  const [pendingFolderDelete, setPendingFolderDelete] = useState<{ id: string; name: string } | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [renameFolderValue, setRenameFolderValue] = useState("")
  const [dragFavId, setDragFavId] = useState<string | null>(null)
  const [dragOverFavId, setDragOverFavId] = useState<string | null>(null)
  const [communityTags, setCommunityTags] = useState<PublicTagEntry[]>([])
  const [loadingCommunity, setLoadingCommunity] = useState(false)

  const lastPendingDeleteRef = useRef<typeof pendingDelete>(null)
  if (pendingDelete) lastPendingDeleteRef.current = pendingDelete
  const deleteDialogData = pendingDelete ?? lastPendingDeleteRef.current

  const lastPendingFolderDeleteRef = useRef<typeof pendingFolderDelete>(null)
  if (pendingFolderDelete) lastPendingFolderDeleteRef.current = pendingFolderDelete
  const folderDeleteDialogData = pendingFolderDelete ?? lastPendingFolderDeleteRef.current

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [historyRes, favRes, folderRes] = await Promise.all([
        fetch("/api/tag/history"),
        fetch("/api/tag/favourites"),
        fetch("/api/tag/favourites/folders"),
      ])

      if (historyRes.ok) {
        const data = await historyRes.json()
        setHistory(data.items ?? [])
      }
      if (favRes.ok) {
        const data = await favRes.json()
        setFavourites(data.items ?? [])
      }
      if (folderRes.ok) {
        const data = await folderRes.json()
        setFolders(data.items ?? [])
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

  const fetchCommunityTags = useCallback(async () => {
    setLoadingCommunity(true)
    try {
      const res = await fetch("/api/tag/favourites?public=true")
      if (res.ok) {
        const data = await res.json()
        setCommunityTags(data.items ?? [])
      }
    } finally {
      setLoadingCommunity(false)
    }
  }, [])

  useEffect(() => {
    if (tab === "community") fetchCommunityTags()
  }, [tab, fetchCommunityTags])

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
      const folderId = activeFolder !== "all" && activeFolder !== "none" ? activeFolder : null
      const res = await fetch("/api/tag/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, name, folderId }),
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

  async function moveFavourite(id: string, folderId: string | null) {
    setFavourites((prev) => prev.map((f) => (f.id === id ? { ...f, folderId } : f)))
    const res = await fetch("/api/tag/favourites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, folderId }),
    })
    if (res.ok) {
      const data = await res.json()
      setFavourites((prev) => prev.map((f) => (f.id === id ? data.item : f)))
    }
  }

  async function togglePublic(item: TagFavouriteEntry) {
    setFavourites((prev) => prev.map((f) => (f.id === item.id ? { ...f, isPublic: !f.isPublic } : f)))
    await fetch("/api/tag/favourites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, isPublic: !item.isPublic }),
    })
  }

  function confirmDelete() {
    if (!pendingDelete) return
    if (pendingDelete.tab === "history") deleteHistory(pendingDelete.id)
    else deleteFavourite(pendingDelete.id)
    setPendingDelete(null)
  }

  async function createFolder() {
    const name = newFolderName.trim()
    if (!name) {
      setCreatingFolder(false)
      return
    }
    const res = await fetch("/api/tag/favourites/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const data = await res.json()
      setFolders((prev) => [...prev, data.item])
      setActiveFolder(data.item.id)
    }
    setNewFolderName("")
    setCreatingFolder(false)
  }

  async function renameFolder(id: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) {
      setRenamingFolderId(null)
      return
    }
    const res = await fetch("/api/tag/favourites/folders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: trimmed }),
    })
    if (res.ok) {
      const data = await res.json()
      setFolders((prev) => prev.map((f) => (f.id === id ? data.item : f)))
    }
    setRenamingFolderId(null)
  }

  async function deleteFolder(id: string) {
    await fetch(`/api/tag/favourites/folders?id=${id}`, { method: "DELETE" })
    setFolders((prev) => prev.filter((f) => f.id !== id))
    setFavourites((prev) => prev.map((f) => (f.folderId === id ? { ...f, folderId: null } : f)))
    setActiveFolder((cur) => (cur === id ? "all" : cur))
  }

  function confirmFolderDelete() {
    if (!pendingFolderDelete) return
    deleteFolder(pendingFolderDelete.id)
    setPendingFolderDelete(null)
  }

  function reorderFavourite(draggedId: string, targetId: string) {
    if (draggedId === targetId) return
    const list = filteredFavourites
    const draggedIndex = list.findIndex((f) => f.id === draggedId)
    const targetIndex = list.findIndex((f) => f.id === targetId)
    if (draggedIndex === -1 || targetIndex === -1) return

    const reordered = [...list]
    const [moved] = reordered.splice(draggedIndex, 1)
    reordered.splice(targetIndex, 0, moved)

    const newIndex = reordered.indexOf(moved)
    const above = reordered[newIndex - 1]
    const below = reordered[newIndex + 1]

    // List is sorted by position DESC, so "above" (earlier in the list) has
    // the higher position and "below" (later) has the lower one.
    let newPosition: number
    if (above && below) newPosition = (above.position + below.position) / 2
    else if (below && !above) newPosition = below.position + 1 // moved to the very top
    else if (above && !below) newPosition = above.position - 1 // moved to the very bottom
    else newPosition = Date.now() / 1000

    setFavourites((prev) => prev.map((f) => (f.id === draggedId ? { ...f, position: newPosition } : f)))
    fetch("/api/tag/favourites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: draggedId, position: newPosition }),
    })
  }

  const filteredHistory = useMemo(() => history.filter((item) => matchesQuery(item, query)), [history, query])

  const filteredFavourites = useMemo(() => {
    return favourites
      .filter((item) => matchesQuery(item, query))
      .filter((item) => {
        if (activeFolder === "all") return true
        if (activeFolder === "none") return item.folderId === null
        return item.folderId === activeFolder
      })
      .sort((a, b) => b.position - a.position)
  }, [favourites, query, activeFolder])

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
          <button
            onClick={() => setTab("community")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "community"
                ? "bg-[var(--app-brand)] text-black"
                : "bg-[var(--app-input-bg)] text-[var(--app-text)] hover:bg-[var(--app-surface-2)]"
            }`}
          >
            Community
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs sm:ml-auto">
          <Icon
            icon="mdi:magnify"
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)]"
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
              <Icon icon="mdi:close" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {tab === "favourites" && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFolder("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFolder === "all"
                ? "bg-[var(--app-brand)] text-black"
                : "bg-[var(--app-input-bg)] text-[var(--app-text)] hover:bg-[var(--app-surface-2)]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFolder("none")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFolder === "none"
                ? "bg-[var(--app-brand)] text-black"
                : "bg-[var(--app-input-bg)] text-[var(--app-text)] hover:bg-[var(--app-surface-2)]"
            }`}
          >
            Unfiled
          </button>
          {folders.map((folder) =>
            renamingFolderId === folder.id ? (
              <input
                key={folder.id}
                autoFocus
                value={renameFolderValue}
                onChange={(e) => setRenameFolderValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") renameFolder(folder.id, renameFolderValue)
                  if (e.key === "Escape") setRenamingFolderId(null)
                }}
                onBlur={() => renameFolder(folder.id, renameFolderValue)}
                className="w-28 px-2 py-1 rounded-lg bg-[var(--app-input-bg)] border border-[var(--app-brand)]
                  text-xs text-[var(--app-text)] focus:outline-none"
              />
            ) : (
              <span
                key={folder.id}
                className={`group flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeFolder === folder.id
                    ? "bg-[var(--app-brand)] text-black"
                    : "bg-[var(--app-input-bg)] text-[var(--app-text)] hover:bg-[var(--app-surface-2)]"
                }`}
                onClick={() => setActiveFolder(folder.id)}
                onDoubleClick={() => {
                  setRenamingFolderId(folder.id)
                  setRenameFolderValue(folder.name)
                }}
              >
                <Icon icon="mdi:folder-outline" className="w-3.5 h-3.5" />
                {folder.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setPendingFolderDelete({ id: folder.id, name: folder.name })
                  }}
                  title="Delete folder"
                  className="ml-0.5 p-0.5 rounded opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity"
                >
                  <Icon icon="mdi:close" className="w-3 h-3" />
                </button>
              </span>
            )
          )}
          {creatingFolder ? (
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createFolder()
                if (e.key === "Escape") setCreatingFolder(false)
              }}
              onBlur={createFolder}
              placeholder="Folder name"
              className="w-28 px-2 py-1 rounded-lg bg-[var(--app-input-bg)] border border-[var(--app-brand)]
                text-xs text-[var(--app-text)] focus:outline-none"
            />
          ) : (
            <button
              onClick={() => setCreatingFolder(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-[var(--app-input-bg)] text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-2)] transition-all"
            >
              <Icon icon="mdi:folder-plus-outline" className="w-3.5 h-3.5" />
              New folder
            </button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--app-text-cream)] text-sm py-4">
          <Icon icon="mdi:loading" className="w-4 h-4 animate-spin text-[var(--app-brand)]" />
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
                    <Icon icon="mdi:pencil" className="w-3.5 h-3.5" />
                    Load
                  </button>
                  <button
                    onClick={() => saveFavourite(item)}
                    disabled={savingFav}
                    title="Add to favourites"
                    className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-brand)] hover:bg-[var(--app-input-bg)] transition-all"
                  >
                    <Icon icon="mdi:star-outline" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPendingDelete({ tab: "history", id: item.id, label: entryLabel(item) })}
                    title="Remove from history"
                    className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-red-400 hover:bg-[var(--app-input-bg)] transition-all"
                  >
                    <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : tab === "community" ? (
        loadingCommunity ? (
          <div className="flex items-center gap-2 text-[var(--app-text-cream)] text-sm py-4">
            <Icon icon="mdi:loading" className="w-4 h-4 animate-spin text-[var(--app-brand)]" />
            Loading...
          </div>
        ) : communityTags.length === 0 ? (
          <p className="text-sm text-[var(--app-text-muted)] py-4">
            No public tags yet. Share one of your favourites from the Favourites tab.
          </p>
        ) : (
          <ul className={`flex flex-col gap-2 overflow-y-auto ${fullPage ? "max-h-[calc(100vh-18rem)]" : "max-h-64"}`}>
            {communityTags.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] p-3"
              >
                <div className="shrink-0 rounded-lg bg-[var(--app-preview-bg)] border border-[var(--app-border)] p-1.5 flex items-center justify-center">
                  <TagThumbnail config={item} scale={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--app-text)] truncate">{item.name || entryLabel(item)}</p>
                  <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                    {styleName(item.styleId)} · by {item.authorName}
                  </p>
                </div>
                <button
                  onClick={() => onLoadConfig(item)}
                  title="Load into generator"
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                    bg-[var(--app-input-bg)] text-[var(--app-text)] border border-[var(--app-border)]
                    hover:bg-[var(--app-surface-2)] hover:border-[var(--app-brand)] transition-all"
                >
                  <Icon icon="mdi:download" className="w-3.5 h-3.5" />
                  Use
                </button>
              </li>
            ))}
          </ul>
        )
      ) : favourites.length === 0 ? (
        <p className="text-sm text-[var(--app-text-muted)] py-4">No favourites yet. Star a tag to save it here.</p>
      ) : filteredFavourites.length === 0 ? (
        <p className="text-sm text-[var(--app-text-muted)] py-4">
          {query ? <>No favourites match &ldquo;{query}&rdquo;.</> : "No favourites in this folder yet."}
        </p>
      ) : (
        <ul className={`flex flex-col gap-2 overflow-y-auto ${fullPage ? "max-h-[calc(100vh-18rem)]" : "max-h-64"}`}>
          {filteredFavourites.map((item) => (
            <li
              key={item.id}
              draggable
              onDragStart={() => setDragFavId(item.id)}
              onDragOver={(e) => {
                e.preventDefault()
                if (dragFavId && dragFavId !== item.id) setDragOverFavId(item.id)
              }}
              onDragLeave={() => setDragOverFavId((cur) => (cur === item.id ? null : cur))}
              onDrop={(e) => {
                e.preventDefault()
                if (dragFavId) reorderFavourite(dragFavId, item.id)
                setDragFavId(null)
                setDragOverFavId(null)
              }}
              onDragEnd={() => {
                setDragFavId(null)
                setDragOverFavId(null)
              }}
              className={`flex items-center gap-2 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] p-3 transition-all ${
                dragFavId === item.id ? "opacity-40" : ""
              } ${dragOverFavId === item.id ? "ring-1 ring-[var(--app-brand)]" : ""}`}
            >
              <span title="Drag to reorder" className="shrink-0 cursor-grab active:cursor-grabbing">
                <Icon icon="mdi:drag-vertical" className="w-4 h-4 text-[var(--app-text-muted)]" />
              </span>
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
              <select
                value={item.folderId ?? ""}
                onChange={(e) => moveFavourite(item.id, e.target.value || null)}
                title="Move to folder"
                className="shrink-0 px-2 py-2 rounded-lg text-xs bg-[var(--app-input-bg)] border border-[var(--app-border)]
                  text-[var(--app-text)] focus:outline-none max-w-[7rem]"
              >
                <option value="">No folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onLoadConfig(item)}
                  title="Load into generator"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                    bg-[var(--app-input-bg)] text-[var(--app-text)] border border-[var(--app-border)]
                    hover:bg-[var(--app-surface-2)] hover:border-[var(--app-brand)] transition-all"
                >
                  <Icon icon="mdi:pencil" className="w-3.5 h-3.5" />
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
                  <Icon icon="mdi:rename-box" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => duplicateFavourite(item)}
                  disabled={savingFav}
                  title="Duplicate"
                  className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-input-bg)] transition-all"
                >
                  <Icon icon="mdi:content-copy" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => togglePublic(item)}
                  title={item.isPublic ? "Public in Community — click to make private" : "Private — click to share in Community"}
                  className={`p-2 rounded-lg transition-all ${
                    item.isPublic
                      ? "text-[var(--app-brand)] hover:bg-[var(--app-input-bg)]"
                      : "text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-input-bg)]"
                  }`}
                >
                  <Icon icon={item.isPublic ? "mdi:earth" : "mdi:lock-outline"} className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setPendingDelete({ tab: "favourites", id: item.id, label: item.name || entryLabel(item) })
                  }
                  title="Remove favourite"
                  className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-red-400 hover:bg-[var(--app-input-bg)] transition-all"
                >
                  <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
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

      <AlertDialog open={pendingFolderDelete !== null} onOpenChange={(open) => !open && setPendingFolderDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder &ldquo;{folderDeleteDialogData?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Favourites inside will be moved to Unfiled, not deleted. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmFolderDelete}
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
