import { createClient, createAdminClient } from "@/lib/supabase/server"
import { configToDbRow, rowToFavouriteEntry } from "@/lib/rank-tag-render"
import type { TagConfiguration } from "@/lib/tag-config-types"
import { checkRateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

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

  if (searchParams.get("public") === "true") {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("tag_favourites")
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
        ...rowToFavouriteEntry(row),
        authorName: nameById.get(String(row.user_id)) ?? "Anonymous",
      })),
    })
  }

  const folderId = searchParams.get("folder_id")

  let query = supabase.from("tag_favourites").select("*").eq("user_id", user.id)
  if (folderId === "none") query = query.is("folder_id", null)
  else if (folderId) query = query.eq("folder_id", folderId)

  const { data, error } = await query.order("position", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: (data ?? []).map(rowToFavouriteEntry) })
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

  const body = (await req.json()) as TagConfiguration & { name?: string; folderId?: string | null }
  if (!body?.text || !body?.styleId) {
    return NextResponse.json({ error: "Invalid tag configuration" }, { status: 400 })
  }

  const rateLimit = checkRateLimit(`fav:create:${user.id}`)
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: `You're saving tags too quickly — try again in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429 }
    )
  }

  const row = {
    ...configToDbRow(body, user.id),
    name: body.name?.trim() || body.text || null,
    folder_id: body.folderId ?? null,
  }

  const { data: inserted, error: insertError } = await supabase
    .from("tag_favourites")
    .insert(row)
    .select("*")
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ item: rowToFavouriteEntry(inserted) })
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

  const body = (await req.json()) as {
    id?: string
    name?: string
    folderId?: string | null
    position?: number
    isPublic?: boolean
  }
  if (!body?.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }
  if (
    body.name === undefined &&
    body.folderId === undefined &&
    body.position === undefined &&
    body.isPublic === undefined
  ) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  if (body.isPublic === true) {
    const rateLimit = checkRateLimit(`fav:publish:${user.id}`)
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
  if (body.folderId !== undefined) update.folder_id = body.folderId
  if (body.isPublic !== undefined) update.is_public = body.isPublic
  if (body.position !== undefined) {
    if (!Number.isFinite(body.position)) {
      return NextResponse.json({ error: "Invalid position" }, { status: 400 })
    }
    update.position = body.position
  }

  const { data: updated, error: updateError } = await supabase
    .from("tag_favourites")
    .update(update)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select("*")
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ item: rowToFavouriteEntry(updated) })
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

  // Admins can remove any tag from the community library, not just their own.
  const query =
    profile?.role === "admin"
      ? createAdminClient().from("tag_favourites").delete().eq("id", id)
      : supabase.from("tag_favourites").delete().eq("id", id).eq("user_id", user.id)

  const { error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
