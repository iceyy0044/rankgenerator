"use client"

import { useCallback, useEffect, useState } from "react"
import { getIconDisplayName } from "@/lib/icon-sheet-config"
import type { TagConfiguration, TagFavouriteEntry, TagHistoryEntry } from "@/lib/tag-config-types"

type Tab = "history" | "favourites"

interface TagSavedPanelProps {
  currentConfig: TagConfiguration
  onLoadConfig: (config: TagConfiguration) => void
  refreshKey?: number
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

export default function TagSavedPanel({ currentConfig, onLoadConfig, refreshKey = 0 }: TagSavedPanelProps) {
  const [tab, setTab] = useState<Tab>("history")
  const [history, setHistory] = useState<TagHistoryEntry[]>([])
  const [favourites, setFavourites] = useState<TagFavouriteEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [savingFav, setSavingFav] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-[#e8eaf0] tracking-tight">History & Favourites</h2>
        <p className="text-xs text-[#7a869a] mt-1">
          Downloads are saved to history. Star tags you want to keep.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "history"
              ? "bg-[#fbbf24] text-black"
              : "bg-[#1e1706] text-[#e8eaf0] hover:bg-[#2a2108]"
          }`}
        >
          History
        </button>
        <button
          onClick={() => setTab("favourites")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "favourites"
              ? "bg-[#fbbf24] text-black"
              : "bg-[#1e1706] text-[#e8eaf0] hover:bg-[#2a2108]"
          }`}
        >
          Favourites
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-[#e6d8a3] text-sm py-4">
          <span className="iconify w-4 h-4 animate-spin text-[#fbbf24]" data-icon="mdi:loading" />
          Loading...
        </div>
      ) : tab === "history" ? (
        history.length === 0 ? (
          <p className="text-sm text-[#7a869a] py-4">No history yet. Download a tag to save it here.</p>
        ) : (
          <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-xl bg-[#0e1117] border border-[rgba(120,80,10,0.12)] p-3"
              >
                <button
                  onClick={() => onLoadConfig(item)}
                  className="flex-1 text-left min-w-0 hover:opacity-80 transition-opacity"
                >
                  <p className="text-sm font-medium text-[#e8eaf0] truncate">{entryLabel(item)}</p>
                  <p className="text-xs text-[#7a869a] mt-0.5">
                    {item.styleId} · {formatDate(item.created_at)}
                  </p>
                </button>
                <button
                  onClick={() => saveFavourite(item)}
                  title="Add to favourites"
                  className="p-2 rounded-lg text-[#7a869a] hover:text-[#fbbf24] hover:bg-[#1e1706] transition-all"
                >
                  <span className="iconify w-4 h-4" data-icon="mdi:star-outline" />
                </button>
                <button
                  onClick={() => deleteHistory(item.id)}
                  title="Remove from history"
                  className="p-2 rounded-lg text-[#7a869a] hover:text-red-400 hover:bg-[#1e1706] transition-all"
                >
                  <span className="iconify w-4 h-4" data-icon="mdi:close" />
                </button>
              </li>
            ))}
          </ul>
        )
      ) : favourites.length === 0 ? (
        <p className="text-sm text-[#7a869a] py-4">No favourites yet. Star a tag to save it here.</p>
      ) : (
        <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {favourites.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-xl bg-[#0e1117] border border-[rgba(120,80,10,0.12)] p-3"
            >
              <button
                onClick={() => onLoadConfig(item)}
                className="flex-1 text-left min-w-0 hover:opacity-80 transition-opacity"
              >
                <p className="text-sm font-medium text-[#e8eaf0] truncate">
                  {item.name || entryLabel(item)}
                </p>
                <p className="text-xs text-[#7a869a] mt-0.5">
                  {item.text} · {item.styleId}
                </p>
              </button>
              <button
                onClick={() => deleteFavourite(item.id)}
                title="Remove favourite"
                className="p-2 rounded-lg text-[#7a869a] hover:text-red-400 hover:bg-[#1e1706] transition-all"
              >
                <span className="iconify w-4 h-4" data-icon="mdi:close" />
              </button>
            </li>
          ))}
        </ul>
      )}
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
