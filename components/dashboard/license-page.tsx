"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"

interface Props {
  licenseKey: string
  isActive: boolean
  activatedAt: string | null
  developerDiscordId: string | null
}

const DISCORD_ID_PATTERN = /^\d{17,20}$/

export default function LicensePageClient({ licenseKey, isActive, activatedAt, developerDiscordId: initialDeveloperId }: Props) {
  const [copied, setCopied] = useState(false)
  const [developerId, setDeveloperId] = useState(initialDeveloperId)
  const [inputValue, setInputValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCopy() {
    await navigator.clipboard.writeText(licenseKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleAddDeveloper(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputValue.trim()

    if (!DISCORD_ID_PATTERN.test(trimmed)) {
      setError("Enter a valid Discord user ID (17–20 digits, found in Discord's user settings).")
      return
    }

    setSaving(true)
    setError(null)

    const res = await fetch("/api/license/developer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordId: trimmed }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "Something went wrong")
      setSaving(false)
      return
    }

    setDeveloperId(trimmed)
    setInputValue("")
    setSaving(false)
  }

  async function handleRemoveDeveloper() {
    setRemoving(true)
    setError(null)

    const res = await fetch("/api/license/developer", { method: "DELETE" })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Failed to remove developer")
      setRemoving(false)
      return
    }

    setDeveloperId(null)
    setRemoving(false)
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[var(--app-text)] tracking-tight">License</h1>
        <p className="text-sm text-[var(--app-text-muted)] mt-1">
          Your license details and developer access.
        </p>
      </div>

      {/* License details */}
      <div className="glass rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-wider">License Key</span>
          <div className="flex items-center gap-2">
            <span className="flex-1 px-4 py-3 rounded-xl bg-[var(--app-input-bg)] border border-[var(--app-border)] font-mono text-sm text-[var(--app-text)] break-all">
              {licenseKey}
            </span>
            <button
              onClick={handleCopy}
              className="shrink-0 px-3 py-3 rounded-xl text-[var(--app-text-muted)] hover:text-[var(--app-text-gold)] hover:bg-[var(--app-nav-hover-bg)] transition-colors"
              title="Copy license key"
            >
              <Icon icon={copied ? "mdi:check" : "mdi:content-copy"} className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-wider">Status</span>
            {isActive ? (
              <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[rgba(52,211,153,0.1)] text-[#34d399] border border-[rgba(52,211,153,0.2)]">
                Active
              </span>
            ) : (
              <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[rgba(248,113,113,0.1)] text-[#f87171] border border-[rgba(248,113,113,0.2)]">
                Inactive
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-wider">Expiry</span>
            <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--app-nav-active-bg)] text-[var(--app-text-gold)] border border-[rgba(201,162,39,0.2)]">
              Lifetime
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-wider">Activated</span>
          <span className="text-sm text-[var(--app-text)]">
            {activatedAt
              ? new Date(activatedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "—"}
          </span>
        </div>
      </div>

      {/* Developer access */}
      <div className="glass rounded-2xl p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--app-text)]">Developer Access</h2>
          <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
            Give one other Discord account access to the generator under your license. They can use it, but won&apos;t see this page.
          </p>
        </div>

        {error && (
          <div className="px-4 py-2.5 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] text-[#f87171] text-sm">
            {error}
          </div>
        )}

        {developerId ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--app-input-bg)] border border-[var(--app-border)]">
            <Icon icon="ic:baseline-discord" className="w-5 h-5 text-[var(--app-text-muted)] shrink-0" />
            <span className="font-mono text-sm text-[var(--app-text)] flex-1 break-all">{developerId}</span>
            <button
              onClick={handleRemoveDeveloper}
              disabled={removing}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-[#f87171] hover:bg-[rgba(248,113,113,0.1)] disabled:opacity-50 transition-colors"
            >
              {removing ? "Removing…" : "Remove"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleAddDeveloper} className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <input
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Discord user ID (e.g. 123456789012345678)"
              className="flex-1 px-4 py-3 rounded-xl bg-[var(--app-input-bg)] border border-[var(--app-border)] text-[var(--app-text)] placeholder-[var(--app-text-muted)]
                font-mono text-sm focus:outline-none focus:border-[var(--app-brand)] focus:ring-1 focus:ring-[rgba(201,162,39,0.3)] transition-all"
            />
            <button
              type="submit"
              disabled={saving || !inputValue.trim()}
              className="shrink-0 px-5 py-3 rounded-xl font-semibold text-[#1a1a1a] bg-[var(--app-brand)] hover:bg-[var(--app-brand-hover)]
                disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150
                shadow-[0_4px_20px_rgba(201,162,39,0.25)] active:scale-[0.98] text-sm"
            >
              {saving ? "Adding…" : "Add Developer"}
            </button>
          </form>
        )}

        <p className="text-[11px] text-[var(--app-text-muted)] leading-relaxed">
          Find a Discord user ID by enabling Developer Mode in Discord (Settings → Advanced), then right-click a user and choose &quot;Copy User ID&quot;.
        </p>
      </div>
    </div>
  )
}
