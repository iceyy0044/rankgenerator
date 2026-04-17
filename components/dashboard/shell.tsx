"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
  avatar: string | null
  role: "user" | "admin"
  hasLicense: boolean
}

interface Props {
  user: User
  children: React.ReactNode
}

export default function DashboardShell({ user, children }: Props) {
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const navItems = [
    {
      href: "/dashboard",
      label: "Generator",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
    ...(user.role === "admin"
      ? [
          {
            href: "/dashboard/admin",
            label: "Admin",
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#0e1117]">
      {/* Top nav */}
      <header className="sticky top-0 z-50 w-full border-b border-[rgba(99,120,180,0.15)] bg-[rgba(14,17,23,0.85)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(79,142,247,0.15)] border border-[rgba(79,142,247,0.25)] flex items-center justify-center">
              <svg className="w-4 h-4 text-[#4f8ef7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-4M9 3l6 6M9 3v6h6" />
              </svg>
            </div>
            <span className="font-bold text-[#e8eaf0] tracking-tight">RankForge</span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${active
                      ? "bg-[rgba(79,142,247,0.15)] text-[#4f8ef7]"
                      : "text-[#7a869a] hover:text-[#e8eaf0] hover:bg-[rgba(99,120,180,0.1)]"
                    }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          <div className="flex items-center gap-3">
            {user.role === "admin" && (
              <span className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[rgba(79,142,247,0.12)] border border-[rgba(79,142,247,0.2)] text-[#4f8ef7] text-xs font-semibold">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
                Admin
              </span>
            )}
            <div className="flex items-center gap-2">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-[rgba(99,120,180,0.25)]" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[rgba(79,142,247,0.2)] flex items-center justify-center text-[#4f8ef7] text-xs font-bold">
                  {user.name[0]?.toUpperCase()}
                </div>
              )}
              <span className="hidden sm:block text-sm text-[#e8eaf0] font-medium max-w-[120px] truncate">{user.name}</span>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#7a869a] hover:text-[#f87171] hover:bg-[rgba(248,113,113,0.08)] transition-all duration-150 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
