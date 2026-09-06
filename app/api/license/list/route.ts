import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: keys, error } = await admin
      .from("license_keys")
      .select("key, namespace, created_at, used_by, used_at, is_active, first_verified_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Key list error:", error)
      return NextResponse.json({ error: "Failed to fetch keys" }, { status: 500 })
    }

    return NextResponse.json({ keys })
  } catch (err) {
    console.error("[v0] Unexpected error in /api/license/list:", err)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
