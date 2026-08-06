import { createClient } from "@/lib/supabase/server"
import { rowToFolderEntry } from "@/lib/rank-tag-render"
import { NextResponse } from "next/server"

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
    .from("tag_favourite_folders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: (data ?? []).map(rowToFolderEntry) })
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

  const body = (await req.json()) as { name?: string }
  const name = body?.name?.trim()
  if (!name) {
    return NextResponse.json({ error: "Missing folder name" }, { status: 400 })
  }

  const { data: inserted, error: insertError } = await supabase
    .from("tag_favourite_folders")
    .insert({ user_id: user.id, name })
    .select("*")
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ item: rowToFolderEntry(inserted) })
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

  const body = (await req.json()) as { id?: string; name?: string }
  if (!body?.id || !body.name?.trim()) {
    return NextResponse.json({ error: "Missing id or name" }, { status: 400 })
  }

  const { data: updated, error: updateError } = await supabase
    .from("tag_favourite_folders")
    .update({ name: body.name.trim() })
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select("*")
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ item: rowToFolderEntry(updated) })
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
    .from("tag_favourite_folders")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
