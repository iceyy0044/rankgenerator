"use client"

import { useState, useEffect, useCallback } from "react"

interface LicenseKey {
  key: string
  namespace: string
  created_at: string
  used_by: string | null
  used_at: string | null
  is_active: boolean
}

export default function AdminDashboardClient() {
  const [keys, setKeys] = useState<LicenseKey[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [namespaceInput, setNamespaceInput] = useState("samsranks")
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/license/list")
    if (res.ok) {
      const data = await res.json()
      setKeys(data.keys ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    setNewKey(null)

    const res = await fetch("/api/license/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ namespace: namespaceInput.trim().toLowerCase() || "samsranks" }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "Failed to generate key")
    } else {
      setNewKey(data.key)
      await fetchKeys()
    }
    setGenerating(false)
  }

  async function handleCopy(key: string) {
    await navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const totalKeys = keys.length
  const usedKeys = keys.filter((k) => k.used_by).length
  const activeKeys = keys.filter((k) => k.is_active && !k.used_by).length

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#f5f5f5] tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-[#a3a3a3] mt-1">Manage license keys and monitor usage.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Keys", value: totalKeys, color: "#f5f5f5" },
          { label: "Available", value: activeKeys, color: "#34d399" },
          { label: "Used", value: usedKeys, color: "#c9a227" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 flex flex-col gap-1">
            <span className="text-xs text-[#a3a3a3] font-medium uppercase tracking-wider">{stat.label}</span>
            <span className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Generate section */}
      <div className="glass rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-[#f5f5f5]">Generate License Key</h2>
            <p className="text-xs text-[#a3a3a3] mt-0.5">Each key can be used by one user to activate their account.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="namespace-input" className="text-[10px] text-[#a3a3a3] font-medium uppercase tracking-wider">
                Namespace
              </label>
              <input
                id="namespace-input"
                value={namespaceInput}
                onChange={(e) => setNamespaceInput(e.target.value)}
                placeholder="samsranks"
                className="w-36 px-3 py-2 rounded-lg bg-[#262626] border border-[rgba(255,255,255,0.1)] text-[#f5f5f5]
                  placeholder-[#6b6b6b] font-mono text-xs focus:outline-none focus:border-[#c9a227] transition-all"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[#1a1a1a]
                bg-[#c9a227] hover:bg-[#ddb62d] disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150 shadow-[0_4px_20px_rgba(201,162,39,0.25)]
                hover:shadow-[0_4px_28px_rgba(201,162,39,0.35)] active:scale-[0.98] text-sm"
            >
              {generating ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              )}
              {generating ? "Generating…" : "Generate Key"}
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-2.5 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] text-[#f87171] text-sm">
            {error}
          </div>
        )}

        {newKey && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(52,211,153,0.08)] border border-[rgba(52,211,153,0.25)]">
            <svg className="w-4 h-4 text-[#34d399] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono text-sm text-[#34d399] flex-1 break-all">{newKey}</span>
            <button
              onClick={() => handleCopy(newKey)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgba(52,211,153,0.15)] text-[#34d399] hover:bg-[rgba(52,211,153,0.25)] transition-all"
            >
              {copiedKey === newKey ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {/* Keys table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#f5f5f5]">All License Keys</h2>
          <button
            onClick={fetchKeys}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[#a3a3a3] hover:text-[#c9a227] transition-colors"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#a3a3a3] text-sm gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading keys…
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#a3a3a3]">
            <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span className="text-sm">No keys generated yet</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Key</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Namespace</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider hidden sm:table-cell">Created</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider hidden md:table-cell">Used At</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {keys.map((k, idx) => (
                  <tr
                    key={k.key}
                    className={`border-b border-[rgba(255,255,255,0.06)] transition-colors hover:bg-[rgba(201,162,39,0.05)] ${
                      idx === keys.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs text-[#f5f5f5] opacity-90 break-all">{k.key}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[rgba(255,255,255,0.06)] text-[#a3a3a3] border border-[rgba(255,255,255,0.1)] font-mono">
                        {k.namespace}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {k.used_by ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[rgba(201,162,39,0.1)] text-[#c9a227] border border-[rgba(201,162,39,0.2)]">
                          Used
                        </span>
                      ) : k.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[rgba(52,211,153,0.1)] text-[#34d399] border border-[rgba(52,211,153,0.2)]">
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[rgba(248,113,113,0.1)] text-[#f87171] border border-[rgba(248,113,113,0.2)]">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-[#a3a3a3] text-xs">
                        {new Date(k.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-[#a3a3a3] text-xs">
                        {k.used_at ? new Date(k.used_at).toLocaleDateString() : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleCopy(k.key)}
                        className="text-xs text-[#a3a3a3] hover:text-[#c9a227] transition-colors px-2 py-1 rounded-lg hover:bg-[rgba(201,162,39,0.1)]"
                      >
                        {copiedKey === k.key ? "Copied!" : "Copy"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
