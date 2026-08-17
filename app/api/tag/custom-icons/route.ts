import { createClient, createAdminClient } from "@/lib/supabase/server"
import { rowToCustomIconEntry } from "@/lib/rank-tag-render"
import { checkRateLimit, PUBLISH_RATE_LIMIT_MS, SAVE_RATE_LIMIT_MS } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

const MAX_IMAGE_DATA_LENGTH = 50_000 // generous ceiling for a small pixel-art PNG data URL

export async function GET(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const isPublic = searchParams.get("public") === "true"

  if (isPublic) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("custom_icons")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const userIds = Array.from(new Set((data ?? []).map((row) => String(row.user_id))))
    const nameById = new Map<string, string>()
    if (userIds.length > 0) {
      const { data: profiles } = await admin.from("profiles").select("id, discord_username").in("id", userIds)
      for (const p of profiles ?? []) {
        nameById.set(p.id as string, (p.discord_username as string) || "Anonymous")
      }
    }

    return NextResponse.json({
      items: (data ?? []).map((row) => ({
        ...rowToCustomIconEntry(row),
        authorName: nameById.get(String(row.user_id)) ?? "Anonymous",
      })),
    })
  }

  const { data, error } = await supabase
    .from("custom_icons")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: (data ?? []).map(rowToCustomIconEntry) })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await req.json()) as { name?: string; imageData?: string }
  if (!body?.imageData || !body.imageData.startsWith("data:image/")) {
    return NextResponse.json({ error: "Missing or invalid imageData (expected a PNG data URL)" }, { status: 400 })
  }
  if (body.imageData.length > MAX_IMAGE_DATA_LENGTH) {
    return NextResponse.json({ error: "Icon image is too large" }, { status: 400 })
  }

  const rateLimit = checkRateLimit(`icon:create:${user.id}`, SAVE_RATE_LIMIT_MS)
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: `You're saving icons too quickly — try again in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429 }
    )
  }

  const { data: inserted, error: insertError } = await supabase
    .from("custom_icons")
    .insert({
      user_id: user.id,
      name: body.name?.trim() || "Untitled Icon",
      image_data: body.imageData,
    })
    .select("*")
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ item: rowToCustomIconEntry(inserted) })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await req.json()) as { id?: string; name?: string; isPublic?: boolean }
  if (!body?.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }
  if (body.name === undefined && body.isPublic === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  if (body.isPublic === true) {
    const rateLimit = checkRateLimit(`icon:publish:${user.id}`, PUBLISH_RATE_LIMIT_MS)
    if (rateLimit.limited) {
      return NextResponse.json(
        { error: `You're publishing too quickly — try again in ${rateLimit.retryAfterSeconds}s.` },
        { status: 429 }
      )
    }
  }

  const update: Record<string, unknown> = {}
  if (body.name !== undefined) {
    if (!body.name.trim()) return NextResponse.json({ error: "Name can't be empty" }, { status: 400 })
    update.name = body.name.trim()
  }
  if (body.isPublic !== undefined) update.is_public = body.isPublic

  const { data: updated, error: updateError } = await supabase
    .from("custom_icons")
    .update(update)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select("*")
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ item: rowToCustomIconEntry(updated) })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  // Admins can remove any icon from the community library, not just their own.
  const query =
    profile?.role === "admin"
      ? createAdminClient().from("custom_icons").delete().eq("id", id)
      : supabase.from("custom_icons").delete().eq("id", id).eq("user_id", user.id)

  const { error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
