"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

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
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container) => {
    console.log(container);
  };

  const options = useMemo(
    () => ({
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: "push",
          },
          onHover: {
            enable: true,
            mode: "repulse",
          },
        },
        modes: {
          push: {
            quantity: 2,
          },
          repulse: {
            distance: 100,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: "#e8d8a8",
        },
        links: {
          color: "#e8d8a8",
          distance: 150,
          enable: true,
          opacity: 0.1,
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: false,
          speed: 1,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 50,
        },
        opacity: {
          value: 0.2,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 3 },
        },
      },
      detectRetina: true,
    }),
    [],
  )

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
        <span
          className="iconify w-5 h-5"
          data-icon="fluent:paint-brush-24-regular"
        />
      ),
    },
    {
      href: "/dashboard/admin",
      label: "Admin",
      icon: <span className="iconify w-5 h-5" data-icon="la:user-shield" />,
      adminOnly: true,
    },
  ].filter((item) => !item.adminOnly || user.role === "admin")

  return (
    <div className="min-h-screen bg-[#0a0d13] text-[#e8eaf0] relative">
      {init && <Particles id="tsparticles" particlesLoaded={particlesLoaded} options={options} className="absolute inset-0 -z-0" />}
      <div
        className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative z-10">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[rgba(120,80,10,0.15)] bg-[#0a0d13]/50 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/logo.png" alt="Sam's Ranks Logo" className="h-8 w-8" />
              <span className="font-bold text-lg text-[#e8d8a8]">
                Sam's Ranks
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img
                src={user.avatar ?? "/placeholder-user.jpg"}
                alt={user.name}
                className="h-8 w-8 rounded-full"
              />
              <div className="flex flex-col text-sm">
                <span className="font-semibold">{user.name}</span>
                <span className="text-xs text-[#7a869a]">{user.email}</span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#e8eaf0] transition-colors hover:bg-[rgba(245,158,11,0.1)]"
              title="Sign Out"
            >
              {signingOut ? (
                <span
                  className="iconify w-5 h-5 animate-spin"
                  data-icon="mdi:loading"
                />
              ) : (
                <span className="iconify w-5 h-5" data-icon="fe:logout" />
              )}
            </button>
          </div>
        </header>

        <div className="flex">
          <aside className="w-56 border-r border-[rgba(120,80,10,0.15)] p-4">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-[rgba(245,158,11,0.1)] text-[#fbbf24]"
                      : "text-[#e8eaf0] hover:bg-[rgba(245,158,11,0.05)]"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
