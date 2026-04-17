"use client"

import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

export default function LoginPageClient() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDiscordLogin() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0e1117]">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(79,142,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(79,142,247,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Glow blobs */}
      <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full bg-[#4f8ef7] opacity-[0.06] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full bg-[#7c5cbf] opacity-[0.05] blur-[100px] pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="glass rounded-2xl p-8 flex flex-col items-center gap-6">
          {/* Logo / Brand */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-14 h-14 rounded-xl bg-[rgba(79,142,247,0.15)] border border-[rgba(79,142,247,0.25)] flex items-center justify-center mb-1">
              <svg className="w-7 h-7 text-[#4f8ef7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-4M9 3l6 6M9 3v6h6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#e8eaf0] tracking-tight">RankForge</h1>
            <p className="text-sm text-[#7a869a] leading-relaxed max-w-xs">
              Generate pixel-perfect Minecraft rank tags in seconds. Sign in with Discord to get started.
            </p>
          </div>

          <div className="w-full h-px bg-[rgba(99,120,180,0.18)]" />

          {/* Discord Button */}
          <button
            onClick={handleDiscordLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl font-semibold text-white transition-all duration-200
              bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
              shadow-[0_4px_20px_rgba(88,101,242,0.35)] hover:shadow-[0_4px_28px_rgba(88,101,242,0.5)]"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
              </svg>
            )}
            {loading ? "Connecting…" : "Continue with Discord"}
          </button>

          {error && (
            <p className="text-sm text-[#f87171] text-center">{error}</p>
          )}

          {/* License notice */}
          <p className="text-xs text-[#7a869a] text-center leading-relaxed">
            A valid license key is required on first sign-in.
            <br />
            Contact an admin to receive one.
          </p>
        </div>

        {/* Features row */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: "⚡", label: "Live Preview" },
            { icon: "🎨", label: "Color Picker" },
            { icon: "📦", label: "PNG Export" },
          ].map((f) => (
            <div key={f.label} className="glass rounded-xl p-3 flex flex-col items-center gap-1 text-center">
              <span className="text-lg">{f.icon}</span>
              <span className="text-xs text-[#7a869a] font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
