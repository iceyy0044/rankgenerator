"use client"

import type { ReactNode } from "react"

interface GeneratorSectionProps {
  title: string
  description?: string
  icon?: string
  children: ReactNode
  className?: string
  actions?: ReactNode
}

export default function GeneratorSection({
  title,
  description,
  icon,
  children,
  className = "",
  actions,
}: GeneratorSectionProps) {
  return (
    <section
      className={`rounded-xl border border-[var(--app-border)] bg-[var(--app-section-bg)] p-4 sm:p-5 flex flex-col gap-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          {icon && (
            <span
              className="iconify w-5 h-5 text-[var(--app-text-gold)] shrink-0 mt-0.5"
              data-icon={icon}
            />
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--app-text)] tracking-tight">{title}</h3>
            {description && <p className="text-xs text-[var(--app-text-muted)] mt-0.5">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  )
}

export function SectionHistoryControls({
  onUndo,
  onRedo,
  onReset,
  canUndo,
  canRedo,
}: {
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
  canUndo: boolean
  canRedo: boolean
}) {
  return (
    <>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo"
        className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-input-bg)]
          disabled:opacity-30 disabled:pointer-events-none transition-all"
      >
        <span className="iconify w-4 h-4" data-icon="mdi:undo" />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo"
        className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-input-bg)]
          disabled:opacity-30 disabled:pointer-events-none transition-all"
      >
        <span className="iconify w-4 h-4" data-icon="mdi:redo" />
      </button>
      <button
        onClick={onReset}
        title="Reset to default"
        className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-red-400 hover:bg-[var(--app-input-bg)] transition-all"
      >
        <span className="iconify w-4 h-4" data-icon="mdi:restore" />
      </button>
    </>
  )
}

export const fieldLabelClass =
  "text-xs font-semibold text-[var(--app-text-label)] uppercase tracking-wider"

export const selectClass =
  "w-full px-4 py-2.5 rounded-xl bg-[var(--app-input-bg)] border border-[var(--app-border)] text-[var(--app-text)] text-sm focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[rgba(245,158,11,0.14)] transition-all appearance-none cursor-pointer"

export const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-[var(--app-input-bg)] border border-[var(--app-border)] text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] text-sm focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[rgba(245,158,11,0.14)] transition-all"
