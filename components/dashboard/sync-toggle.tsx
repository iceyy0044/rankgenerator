"use client"

interface SyncToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description: string
}

export default function SyncToggle({ label, checked, onChange, description }: SyncToggleProps) {
  return (
    <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-input-bg)]/40 p-3 flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[var(--app-text-label)] uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={`${label}: ${checked ? "synced" : "independent"}`}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(245,158,11,0.35)] ${
              checked
                ? "border-[var(--app-brand)] bg-[var(--app-brand)]"
                : "border-[var(--app-border)] bg-[var(--app-input-bg)] hover:border-[rgba(245,158,11,0.4)]"
            }`}
          >
            <span
              className={`pointer-events-none absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                checked ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-xs font-medium min-w-[4.5rem] ${checked ? "text-[var(--app-text-gold)]" : "text-[var(--app-text-muted)]"}`}>
            {checked ? "Synced" : "Separate"}
          </span>
        </div>
      </div>
      <p className="text-[11px] text-[var(--app-text-muted)] leading-snug">{description}</p>
    </div>
  )
}
