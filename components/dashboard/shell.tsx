"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Icon } from "@iconify/react"
import ThemeToggle from "@/components/dashboard/theme-toggle"

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
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
      exact: true,
      icon: <Icon icon="fluent:paint-brush-24-regular" className="w-5 h-5" />,
    },
    {
      href: "/dashboard/history",
      label: "History",
      icon: <Icon icon="mdi:history" className="w-5 h-5" />,
    },
    {
      href: "/dashboard/community",
      label: "Community",
      icon: <Icon icon="mdi:account-group" className="w-5 h-5" />,
    },
    {
      href: "/dashboard/license",
      label: "License",
      icon: <Icon icon="mdi:key-variant" className="w-5 h-5" />,
      licenseOnly: true,
    },
    {
      href: "/dashboard/admin",
      label: "Admin",
      icon: <Icon icon="la:user-shield" className="w-5 h-5" />,
      adminOnly: true,
    },
  ].filter((item) => (!item.adminOnly || user.role === "admin") && (!item.licenseOnly || user.hasLicense))

  function isNavActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <div className="relative min-h-screen w-full bg-[var(--background)]">
      <div
        className="fixed inset-0 z-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,162,39,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="fixed top-[-15%] left-[5%] w-[500px] h-[500px] rounded-full bg-[#c9a227] opacity-[0.05] blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full bg-[#c9a227] opacity-[0.04] blur-[110px] pointer-events-none z-0" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-header-bg)] px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-[var(--app-text)]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Icon icon="fluent:line-horizontal-3-20-filled" className="h-6 w-6" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/logo.png" alt="Sam's Ranks Logo" className="h-8 w-8 rounded-lg object-cover" />
              <span className="hidden font-bold text-lg text-[var(--app-text-gold)] sm:inline">
                Sam&apos;s Ranks
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <img
                src={user.avatar ?? "/placeholder-user.jpg"}
                alt={user.name}
                className="h-8 w-8 rounded-full"
              />
              <div className="hidden flex-col text-sm sm:flex">
                <span className="font-semibold text-[var(--app-text)]">{user.name}</span>
                <span className="text-xs text-[var(--app-text-muted)]">{user.email}</span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--app-text)] transition-colors hover:bg-[var(--app-nav-hover-bg)]"
              title="Sign Out"
            >
              {signingOut ? (
                <Icon icon="mdi:loading" className="h-5 w-5 animate-spin" />
              ) : (
                <Icon icon="fe:logout" className="h-5 w-5" />
              )}
            </button>
          </div>
        </header>

        <div className="flex flex-1">
          <aside
            className={`fixed top-16 z-20 h-[calc(100vh-4rem)] w-56 border-r border-[var(--app-border)] bg-[var(--app-sidebar-bg)] p-4 backdrop-blur-sm transition-transform md:relative md:top-0 md:h-auto md:translate-x-0 ${
              isMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isNavActive(item.href, item.exact)
                      ? "bg-[var(--app-nav-active-bg)] text-[var(--app-text-gold)]"
                      : "text-[var(--app-text)] hover:bg-[var(--app-nav-hover-bg)]"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 bg-[var(--app-main-bg)] p-4 backdrop-blur-sm sm:p-6 w-full overflow-x-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
