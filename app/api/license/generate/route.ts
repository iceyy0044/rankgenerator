import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

function generateKey(): string {
  const bytes = randomBytes(12)
  const hex = bytes.toString("hex").toUpperCase()
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 24)}`
}

export async function POST() {
  try {
    // Use cookie client only for auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use admin client for DB reads/writes
    const admin = createAdminClient()

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 })
    }

    const key = generateKey()

    const { error } = await admin
      .from("license_keys")
      .insert({ key, created_by: user.id })

    if (error) {
      console.error("[v0] Key insert error:", error)
      return NextResponse.json({ error: "Failed to generate key" }, { status: 500 })
    }

    return NextResponse.json({ key })
  } catch (err) {
    console.error("[v0] Unexpected error in /api/license/generate:", err)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
