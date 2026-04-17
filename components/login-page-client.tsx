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
            "linear-gradient(rgba(245,158,11,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Glow blobs */}
      <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full bg-[#f59e0b] opacity-[0.06] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full bg-[#eab308] opacity-[0.05] blur-[100px] pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="glass rounded-2xl p-8 flex flex-col items-center gap-6">
          {/* Logo / Brand */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-14 h-14 rounded-xl bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.25)] flex items-center justify-center mb-1">
              <img src="/logo.png" alt="Sam's Ranks Logo" className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-[#e8eaf0] tracking-tight">
              Welcome to Sam's Ranks
            </h1>
            <p className="text-sm text-[#7a869a]">
              The ultimate tool for creating Minecraft rank tags.
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-[rgba(245,158,11,0.15)]" />

          {/* Login Button */}
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={handleDiscordLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#5865F2] text-white font-semibold transition-all hover:bg-[#4a54c9] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span
                    className="iconify w-5 h-5 animate-spin"
                    data-icon="mdi:loading"
                  />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span
                    className="iconify w-6 h-6"
                    data-icon="ic:baseline-discord"
                  />
                  <span>Sign in with Discord</span>
                </>
              )}
            </button>
            <p className="text-xs text-center text-[#7a869a]">
              By signing in, you agree to our Terms of Service on BBB. In order to use our services you have to have a valid license key.
            </p>
          </div>

          {error && (
            <div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 text-center">
              {error}
            </div>
          )}
        </div>
        <footer className="text-center text-sm text-[#7a869a] py-8">
          © {new Date().getFullYear()} Sam's Ranks. All Rights Reserved.
        </footer>
      </div>
    </div>
  )
}
