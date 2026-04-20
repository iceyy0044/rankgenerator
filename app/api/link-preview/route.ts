import { NextResponse } from "next/server"

const ALLOWED_HOSTS = new Set(["builtbybit.com", "www.builtbybit.com"])

const KNOWN_BBB_IMAGE_BY_RESOURCE_ID: Record<string, string> = {
  "102896": "https://builtbybit.com/attachments/beta-testing-1-png.1282637/?preset=fullr1",
  "103383": "https://builtbybit.com/attachments/beta-testing-3-png.1291247/?preset=fullr1",
  "103323": "https://builtbybit.com/attachments/beta-testing-png.1288382/?preset=fullr1",
  "102606": "https://builtbybit.com/attachments/medieval-hotbar-png.1280053/?preset=fullr1",
  "102310": "https://builtbybit.com/attachments/beta-testing-png.1277469/?preset=fullr1",
  "70302": "https://builtbybit.com/attachments/firewebtemplate_preview_main-png.986445/?preset=fullr1",
  "102490": "https://builtbybit.com/attachments/topazwebtemplate_banners-png.1284097/?preset=fullr1",
  "70116": "https://builtbybit.com/attachments/bbb-banner-free-website-v1-png.984676/?preset=fullr1",
}

function extractResourceId(pathname: string): string | null {
  const slugMatch = pathname.match(/\.(\d+)\/?$/)
  if (slugMatch?.[1]) return slugMatch[1]

  const idMatch = pathname.match(/\/resources\/(\d+)(?:\/|$)/)
  if (idMatch?.[1]) return idMatch[1]

  return null
}

function extractMetaContent(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const propertyFirst = new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    )
    const contentFirst = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["'][^>]*>`,
      "i"
    )

    const propertyFirstMatch = html.match(propertyFirst)
    if (propertyFirstMatch?.[1]) return propertyFirstMatch[1]

    const contentFirstMatch = html.match(contentFirst)
    if (contentFirstMatch?.[1]) return contentFirstMatch[1]
  }

  return null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const rawUrl = searchParams.get("url")

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url query parameter." }, { status: 400 })
  }

  let targetUrl: URL
  try {
    targetUrl = new URL(rawUrl)
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 })
  }

  if (!ALLOWED_HOSTS.has(targetUrl.hostname.toLowerCase())) {
    return NextResponse.json({ error: "Host not allowed." }, { status: 400 })
  }

  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Invalid protocol." }, { status: 400 })
  }

  // BBB is protected by anti-bot checks server-side, so known resource IDs use
  // curated preview images first for reliable rendering.
  const resourceId = extractResourceId(targetUrl.pathname)
  if (resourceId && KNOWN_BBB_IMAGE_BY_RESOURCE_ID[resourceId]) {
    return NextResponse.json(
      { imageUrl: KNOWN_BBB_IMAGE_BY_RESOURCE_ID[resourceId] },
      {
        status: 200,
        headers: { "Cache-Control": "public, max-age=21600" },
      }
    )
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; RankTagGenerator/1.0)",
        accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 43200 },
    })

    if (!response.ok) {
      return NextResponse.json({ imageUrl: null }, { status: 200 })
    }

    const html = await response.text()
    const imageCandidate = extractMetaContent(html, ["og:image", "og:image:secure_url", "twitter:image"])

    if (!imageCandidate) {
      return NextResponse.json(
        { imageUrl: null },
        {
          status: 200,
          headers: { "Cache-Control": "public, max-age=300" },
        }
      )
    }

    let imageUrl: string
    try {
      imageUrl = new URL(imageCandidate, targetUrl).toString()
    } catch {
      imageUrl = imageCandidate
    }

    return NextResponse.json(
      { imageUrl },
      {
        status: 200,
        headers: { "Cache-Control": "public, max-age=21600" },
      }
    )
  } catch {
    return NextResponse.json({ imageUrl: null }, { status: 200 })
  }
}
