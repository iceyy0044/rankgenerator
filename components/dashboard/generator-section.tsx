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
      className={`rounded-xl border border-[rgba(120,80,10,0.12)] bg-[#0e1117]/40 p-4 sm:p-5 flex flex-col gap-4 ${className}`}
    >
      <div className="flex items-start gap-2.5">
        {icon && (
          <span
            className="iconify w-5 h-5 text-[#fbbf24] shrink-0 mt-0.5"
            data-icon={icon}
          />
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#e8eaf0] tracking-tight">{title}</h3>
          {description && <p className="text-xs text-[#7a869a] mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

export const fieldLabelClass =
  "text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider"

export const selectClass =
  "w-full px-4 py-2.5 rounded-xl bg-[#1e1706] border border-[rgba(120,80,10,0.12)] text-[#e8eaf0] text-sm focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[rgba(245,158,11,0.14)] transition-all appearance-none cursor-pointer"

export const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-[#1e1706] border border-[rgba(120,80,10,0.12)] text-[#fff8e1] placeholder-[#6b4f1a] text-sm focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[rgba(245,158,11,0.14)] transition-all"
