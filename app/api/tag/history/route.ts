import { createClient } from "@/lib/supabase/server"
import { configToDbRow, rowToHistoryEntry } from "@/lib/rank-tag-render"
import type { TagConfiguration } from "@/lib/tag-config-types"
import { NextResponse } from "next/server"

const MAX_HISTORY = 50

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("tag_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: (data ?? []).map(rowToHistoryEntry) })
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

  const body = (await req.json()) as TagConfiguration
  if (!body?.text || !body?.styleId) {
    return NextResponse.json({ error: "Invalid tag configuration" }, { status: 400 })
  }

  const row = configToDbRow(body, user.id)

  const { data: inserted, error: insertError } = await supabase
    .from("tag_history")
    .insert(row)
    .select("*")
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const { data: allItems } = await supabase
    .from("tag_history")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (allItems && allItems.length > MAX_HISTORY) {
    const idsToDelete = allItems.slice(MAX_HISTORY).map((item) => item.id)
    await supabase.from("tag_history").delete().in("id", idsToDelete)
  }

  return NextResponse.json({ item: rowToHistoryEntry(inserted) })
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

  const { error } = await supabase
    .from("tag_history")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
