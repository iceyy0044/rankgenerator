export const ICON_PRESETS: { id: string; label: string; iconifyId: string }[] = [
  { id: "crown", label: "Crown", iconifyId: "mdi:crown" },
  { id: "sword", label: "Sword", iconifyId: "mdi:sword" },
  { id: "shield", label: "Shield", iconifyId: "mdi:shield" },
  { id: "star", label: "Star", iconifyId: "mdi:star" },
  { id: "diamond", label: "Diamond", iconifyId: "mdi:diamond-stone" },
  { id: "heart", label: "Heart", iconifyId: "mdi:heart" },
  { id: "skull", label: "Skull", iconifyId: "mdi:skull" },
  { id: "fire", label: "Fire", iconifyId: "mdi:fire" },
]

export async function iconifyToDataUrl(iconifyId: string, size = 16): Promise<string | null> {
  if (typeof window === "undefined") return null

  const Iconify = (window as Window & { Iconify?: { renderSVG: (icon: string, opts?: object) => SVGElement | null } }).Iconify
  if (!Iconify) return null

  const svg = Iconify.renderSVG(iconifyId, { width: size, height: size })
  if (!svg) return null

  svg.setAttribute("width", String(size))
  svg.setAttribute("height", String(size))

  const svgStr = new XMLSerializer().serializeToString(svg)
  const blob = new Blob([svgStr], { type: "image/svg+xml" })
  const url = URL.createObjectURL(blob)

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = url
    })

    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, size, size)
    return canvas.toDataURL("image/png")
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
