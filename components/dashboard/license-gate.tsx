"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LicenseGate() {
  const [key, setKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch("/api/license/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: key.trim() }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "Something went wrong")
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="glass rounded-2xl p-8 w-full max-w-md flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="w-12 h-12 rounded-xl bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)] flex items-center justify-center">
            <svg className="w-6 h-6 text-[#fbbf24]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#e8eaf0]">License Required</h2>
          <p className="text-sm text-[#7a869a] leading-relaxed">
            You need a valid license key to access the generator. Enter your key below to activate your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#7a869a] uppercase tracking-wider">License Key</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              className="w-full px-4 py-3 rounded-xl bg-[#1e2435] border border-[rgba(99,120,180,0.2)] text-[#e8eaf0] placeholder-[#4a5568]
                font-mono text-sm focus:outline-none focus:border-[#4f8ef7] focus:ring-1 focus:ring-[rgba(79,142,247,0.3)] transition-all"
              required
            />
          </div>

          {error && (
            <div className="px-4 py-2.5 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] text-[#f87171] text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full py-3 rounded-xl font-semibold text-white bg-[#4f8ef7] hover:bg-[#6ba3ff]
              disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150
              shadow-[0_4px_20px_rgba(79,142,247,0.3)] hover:shadow-[0_4px_28px_rgba(79,142,247,0.45)]
              active:scale-[0.98]"
          >
            {loading ? "Activating…" : "Activate License"}
          </button>
        </form>
      </div>
    </div>
  )
}
