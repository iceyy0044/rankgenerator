import { createClient } from "@/lib/supabase/server"
import { rowToCustomIconEntry } from "@/lib/rank-tag-render"
import { NextResponse } from "next/server"

/** Fetches a single custom icon by id — used to resolve `library:<id>` icon references when rendering. RLS scopes this to the caller's own icons or public ones. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase.from("custom_icons").select("*").eq("id", id).single()

  if (error || !data) {
    return NextResponse.json({ error: "Icon not found" }, { status: 404 })
  }

  return NextResponse.json({ item: rowToCustomIconEntry(data) })
}
