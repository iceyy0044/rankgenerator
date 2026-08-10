"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@iconify/react"
import { RANK_TAG_STYLES } from "@/lib/rank-tag-config"
import { getIconDisplayName } from "@/lib/icon-sheet-config"
import type { PublicIconEntry, PublicTagEntry, TagConfiguration } from "@/lib/tag-config-types"
import { stashTagConfigForGenerator } from "@/lib/tag-config-storage"
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

type SubTab = "tags" | "icons"
type PendingDelete = { type: SubTab; id: string; label: string }

interface Props {
  isAdmin: boolean
}

function styleName(styleId: string) {
  return RANK_TAG_STYLES.find((s) => s.id === styleId)?.name ?? styleId
}

function entryLabel(entry: TagConfiguration) {
  const parts = [entry.text || "(empty)"]
  const iconName = getIconDisplayName(entry.iconId)
  if (iconName) parts.push(`+ ${iconName}`)
  return parts.join(" ")
}

export default function CommunityPageClient({ isAdmin }: Props) {
  const router = useRouter()
  const [subTab, setSubTab] = useState<SubTab>("tags")
  const [tags, setTags] = useState<PublicTagEntry[]>([])
  const [icons, setIcons] = useState<PublicIconEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [deleting, setDeleting] = useState(false)

  const lastPendingDeleteRef = useRef<PendingDelete | null>(null)
  if (pendingDelete) lastPendingDeleteRef.current = pendingDelete
  const deleteDialogData = pendingDelete ?? lastPendingDeleteRef.current

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [tagsRes, iconsRes] = await Promise.all([
        fetch("/api/tag/favourites?public=true"),
        fetch("/api/tag/custom-icons?public=true"),
      ])
      if (tagsRes.ok) {
        const data = await tagsRes.json()
        setTags(data.items ?? [])
      }
      if (iconsRes.ok) {
        const data = await iconsRes.json()
        setIcons(data.items ?? [])
      }
    } catch {
      setError("Could not load the community library")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  function handleUseTag(item: PublicTagEntry) {
    stashTagConfigForGenerator(item)
    router.push("/dashboard")
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    setError(null)
    const endpoint = pendingDelete.type === "tags" ? "/api/tag/favourites" : "/api/tag/custom-icons"
    const res = await fetch(`${endpoint}?id=${pendingDelete.id}`, { method: "DELETE" })
    if (res.ok) {
      if (pendingDelete.type === "tags") setTags((prev) => prev.filter((t) => t.id !== pendingDelete.id))
      else setIcons((prev) => prev.filter((i) => i.id !== pendingDelete.id))
    } else {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Could not delete that item")
    }
    setDeleting(false)
    setPendingDelete(null)
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--app-text)]">Community</h1>
        <p className="mt-1 text-sm text-[var(--app-text-muted)]">
          Tags and icons other players have shared publicly. Share your own from the Favourites or icon editor.
        </p>
      </div>

      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--app-input-bg)] border border-[var(--app-border)] w-fit">
        {(["tags", "icons"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              subTab === t
                ? "bg-[var(--app-brand)] text-black"
                : "text-[var(--app-text)] hover:bg-[var(--app-surface-2)]"
            }`}
          >
            {t === "tags" ? `Tags (${tags.length})` : `Icons (${icons.length})`}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--app-text-cream)] text-sm py-4">
          <Icon icon="mdi:loading" className="w-4 h-4 animate-spin text-[var(--app-brand)]" />
          Loading...
        </div>
      ) : subTab === "tags" ? (
        tags.length === 0 ? (
          <p className="text-sm text-[var(--app-text-muted)] py-4">No public tags yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tags.map((item) => (
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
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleUseTag(item)}
                    title="Load into generator"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                      bg-[var(--app-input-bg)] text-[var(--app-text)] border border-[var(--app-border)]
                      hover:bg-[var(--app-surface-2)] hover:border-[var(--app-brand)] transition-all"
                  >
                    <Icon icon="mdi:download" className="w-3.5 h-3.5" />
                    Use
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() =>
                        setPendingDelete({ type: "tags", id: item.id, label: item.name || entryLabel(item) })
                      }
                      title="Remove from community"
                      className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-red-400 hover:bg-[var(--app-input-bg)] transition-all"
                    >
                      <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )
      ) : icons.length === 0 ? (
        <p className="text-sm text-[var(--app-text-muted)] py-4">No public icons yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {icons.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] p-3"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[var(--app-border)] flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageData} alt={item.name} className="w-7 h-7" style={{ imageRendering: "pixelated" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--app-text)] truncate">{item.name}</p>
                <p className="text-xs text-[var(--app-text-muted)] mt-0.5">by {item.authorName}</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setPendingDelete({ type: "icons", id: item.id, label: item.name })}
                  title="Remove from community"
                  className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-red-400 hover:bg-[var(--app-input-bg)] transition-all shrink-0"
                >
                  <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove &ldquo;{deleteDialogData?.label}&rdquo; from Community?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from the public library for everyone. The owner keeps their own copy — this can&apos;t be
              undone from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-500 text-white hover:bg-red-600 focus:ring-red-400"
            >
              {deleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
