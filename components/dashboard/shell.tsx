"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"

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
  const [init, setInit] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setInit(true)
    })
  }, [])

  const particlesLoaded = useCallback(async (container: any) => {
    await console.log(container)
  }, [])

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

  const particleOptions = {
    autoPlay: true,
    background: {
      color: {
        value: "#0a0d13",
      },
      image: "",
      position: "",
      repeat: "",
      size: "",
      opacity: 1,
    },
    backgroundMask: {
      composite: "destination-out",
      cover: {
        opacity: 1,
        color: {
          value: "",
        },
      },
      enable: false,
    },
    clear: true,
    defaultThemes: {},
    delay: 0,
    fullScreen: {
      enable: true,
      zIndex: 0,
    },
    detectRetina: true,
    duration: 0,
    fpsLimit: 120,
    interactivity: {
      detectsOn: "window",
      events: {
        onClick: {
          enable: false,
          mode: {},
        },
        onDiv: {
          selectors: {},
          enable: false,
          mode: {},
          type: "circle",
        },
        onHover: {
          enable: false,
          mode: {},
          parallax: {
            enable: false,
            force: 2,
            smooth: 10,
          },
        },
        resize: {
          delay: 0.5,
          enable: true,
        },
      },
      modes: {
        trail: {
          delay: 1,
          pauseOnStop: false,
          quantity: 1,
        },
        attract: {
          distance: 200,
          duration: 0.4,
          easing: "ease-out-quad",
          factor: 1,
          maxSpeed: 50,
          speed: 1,
        },
        bounce: {
          distance: 200,
        },
        bubble: {
          distance: 200,
          duration: 0.4,
          mix: false,
        },
        connect: {
          distance: 80,
          links: {
            opacity: 0.5,
          },
          radius: 60,
        },
        grab: {
          distance: 100,
          links: {
            blink: false,
            consent: false,
            opacity: 1,
          },
        },
        push: {
          default: true,
          groups: [],
          quantity: 4,
        },
        remove: {
          quantity: 2,
        },
        repulse: {
          distance: 200,
          duration: 0.4,
          factor: 100,
          speed: 1,
          maxSpeed: 50,
          easing: "ease-out-quad",
        },
        slow: {
          factor: 3,
          radius: 200,
        },
        particle: {
          replaceCursor: false,
          pauseOnStop: false,
          stopDelay: 0,
        },
        light: {
          area: {
            gradient: {
              start: {
                value: "#ffffff",
              },
              stop: {
                value: "#000000",
              },
            },
            radius: 1000,
          },
          shadow: {
            color: {
              value: "#000000",
            },
            length: 2000,
          },
        },
      },
    },
    manualParticles: [],
    particles: {
      bounce: {
        horizontal: {
          value: 1,
        },
        vertical: {
          value: 1,
        },
      },
      collisions: {
        absorb: {
          speed: 2,
        },
        bounce: {
          horizontal: {
            value: 1,
          },
          vertical: {
            value: 1,
          },
        },
        enable: false,
        maxSpeed: 50,
        mode: "bounce",
        overlap: {
          enable: true,
          retries: 0,
        },
      },
      color: {
        value: "#fff",
        animation: {
          h: {
            count: 0,
            enable: false,
            speed: 1,
            decay: 0,
            delay: 0,
            sync: true,
            offset: 0,
          },
          s: {
            count: 0,
            enable: false,
            speed: 1,
            decay: 0,
            delay: 0,
            sync: true,
            offset: 0,
          },
          l: {
            count: 0,
            enable: false,
            speed: 1,
            decay: 0,
            delay: 0,
            sync: true,
            offset: 0,
          },
        },
      },
      effect: {
        close: true,
        fill: true,
        options: {},
        type: {},
      },
      groups: [],
      move: {
        angle: {
          offset: 0,
          value: 90,
        },
        attract: {
          distance: 200,
          enable: false,
          rotate: {
            x: 3000,
            y: 3000,
          },
        },
        center: {
          x: 50,
          y: 50,
          mode: "percent",
          radius: 0,
        },
        decay: 0,
        distance: {},
        direction: "bottom",
        drift: 0,
        enable: true,
        gravity: {
          acceleration: 9.81,
          enable: false,
          inverse: false,
          maxSpeed: 50,
        },
        path: {
          clamp: true,
          delay: {
            value: 0,
          },
          enable: false,
          options: {},
        },
        outModes: {
          default: "out",
          bottom: "out",
          left: "out",
          right: "out",
          top: "out",
        },
        random: false,
        size: false,
        speed: 2,
        spin: {
          acceleration: 0,
          enable: false,
        },
        straight: true,
        trail: {
          enable: false,
          length: 10,
          fill: {},
        },
        vibrate: false,
        warp: false,
      },
      number: {
        density: {
          enable: true,
          width: 1920,
          height: 1080,
        },
        limit: {
          mode: "delete",
          value: 0,
        },
        value: 1200,
      },
      opacity: {
        value: 1,
        animation: {
          count: 0,
          enable: false,
          speed: 2,
          decay: 0,
          delay: 0,
          sync: false,
          mode: "auto",
          startValue: "random",
          destroy: "none",
        },
      },
      reduceDuplicates: false,
      shadow: {
        blur: 0.5,
        color: {
          value: "#00000041",
        },
        enable: true,
        offset: {
          x: 0,
          y: 0,
        },
      },
      shape: {
        close: true,
        fill: true,
        options: {},
        type: "circle",
      },
      size: {
        value: 2,
        animation: {
          count: 0,
          enable: false,
          speed: 5,
          decay: 0,
          delay: 0,
          sync: false,
          mode: "auto",
          startValue: "random",
          destroy: "none",
        },
      },
      stroke: {
        width: 0,
      },
      zIndex: {
        value: {
          min: 0,
          max: 100,
        },
        opacityRate: 25,
        sizeRate: 5,
        velocityRate: 10,
      },
      destroy: {
        bounds: {},
        mode: "none",
        split: {
          count: 1,
          factor: {
            value: 3,
          },
          rate: {
            value: {
              min: 4,
              max: 9,
            },
          },
          sizeOffset: true,
          particles: {},
        },
      },
      roll: {
        darken: {
          enable: false,
          value: 0,
        },
        enable: false,
        enlighten: {
          enable: false,
          value: 0,
        },
        mode: "vertical",
        speed: 25,
      },
      tilt: {
        value: 0,
        animation: {
          enable: false,
          speed: 0,
          decay: 0,
          sync: false,
        },
        direction: "clockwise",
        enable: false,
      },
      twinkle: {
        lines: {
          enable: false,
          frequency: 0.05,
          opacity: 1,
        },
        particles: {
          enable: false,
          frequency: 0.05,
          opacity: 1,
        },
      },
      wobble: {
        distance: 10,
        enable: true,
        speed: {
          angle: 10,
          move: 10,
        },
      },
      life: {
        count: 0,
        delay: {
          value: 0,
          sync: false,
        },
        duration: {
          value: 0,
          sync: false,
        },
      },
      rotate: {
        value: 0,
        animation: {
          enable: false,
          speed: 0,
          decay: 0,
          sync: false,
        },
        direction: "clockwise",
        path: false,
      },
      orbit: {
        animation: {
          count: 0,
          enable: false,
          speed: 1,
          decay: 0,
          delay: 0,
          sync: false,
        },
        enable: false,
        opacity: 1,
        rotation: {
          value: 45,
        },
        width: 1,
      },
      links: {
        blink: false,
        color: {
          value: "#fff",
        },
        consent: false,
        distance: 100,
        enable: false,
        frequency: 1,
        opacity: 1,
        shadow: {
          blur: 2.5,
          color: {
            value: "#0000008f",
          },
          enable: false,
        },
        triangles: {
          enable: false,
          frequency: 1,
        },
        width: 1,
        warp: false,
      },
      repulse: {
        value: 0,
        enabled: false,
        distance: 1,
        duration: 1,
        factor: 1,
        speed: 1,
      },
    },
    pauseOnBlur: true,
    pauseOnOutsideViewport: true,
    responsive: [],
    smooth: false,
    style: {},
    themes: [],
    zLayers: 100,
    key: "snow",
    name: "Snow",
    motion: {
      disable: true,
      reduce: {
        factor: 4,
        value: true,
      },
    },
  }

  return (
    <>
      {init && (
        <Particles
          id="tsparticles"
          particlesLoaded={particlesLoaded}
          options={particleOptions as any}
        />
      )}
      <div className="relative z-10">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[rgba(120,80,10,0.15)] bg-[#0a0d13]/50 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span
                className="iconify h-6 w-6"
                data-icon="fluent:line-horizontal-3-20-filled"
              />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/logo.png" alt="Sam's Ranks Logo" className="h-8 w-8" />
              <span className="hidden font-bold text-lg text-[#e8d8a8] sm:inline">
                Sam's Ranks
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <img
                src={user.avatar ?? "/placeholder-user.jpg"}
                alt={user.name}
                className="h-8 w-8 rounded-full"
              />
              <div className="hidden flex-col text-sm sm:flex">
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
                  className="iconify h-5 w-5 animate-spin"
                  data-icon="mdi:loading"
                />
              ) : (
                <span className="iconify h-5 w-5" data-icon="fe:logout" />
              )}
            </button>
          </div>
        </header>

        <div className="flex">
          <aside
            className={`fixed top-16 z-20 h-[calc(100vh-4rem)] w-56 border-r border-[rgba(120,80,10,0.15)] bg-[#0a0d13]/80 p-4 backdrop-blur-sm transition-transform md:relative md:top-0 md:h-auto md:translate-x-0 ${
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

          <main className="flex-1 bg-[#0a0d13]/50 p-4 backdrop-blur-sm sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
