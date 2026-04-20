import { NextResponse } from "next/server"

const ALLOWED_HOSTS = new Set(["builtbybit.com", "www.builtbybit.com"])

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
