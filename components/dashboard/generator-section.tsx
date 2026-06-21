"use client"

import type { ReactNode } from "react"

interface GeneratorSectionProps {
  title: string
  description?: string
  icon?: string
  children: ReactNode
  className?: string
}

export default function GeneratorSection({
  title,
  description,
  icon,
  children,
  className = "",
}: GeneratorSectionProps) {
  return (
    <section
      className={`rounded-xl border border-[var(--app-border)] bg-[var(--app-section-bg)] p-4 sm:p-5 flex flex-col gap-4 ${className}`}
    >
      <div className="flex items-start gap-2.5">
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
      {children}
    </section>
  )
}

export const fieldLabelClass =
  "text-xs font-semibold text-[var(--app-text-label)] uppercase tracking-wider"

export const selectClass =
  "w-full px-4 py-2.5 rounded-xl bg-[var(--app-input-bg)] border border-[var(--app-border)] text-[var(--app-text)] text-sm focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[rgba(245,158,11,0.14)] transition-all appearance-none cursor-pointer"

export const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-[var(--app-input-bg)] border border-[var(--app-border)] text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] text-sm focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[rgba(245,158,11,0.14)] transition-all"
