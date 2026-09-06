import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

function generateKey(): string {
  const bytes = randomBytes(12)
  const hex = bytes.toString("hex").toUpperCase()
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 24)}`
}

const DEFAULT_NAMESPACE = "samsranks"
const NAMESPACE_PATTERN = /^[a-z0-9_-]{1,40}$/

export async function POST(req: Request) {
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

    const body = await req.json().catch(() => ({}))
    const rawNamespace = typeof body?.namespace === "string" ? body.namespace.trim().toLowerCase() : ""
    const namespace = rawNamespace || DEFAULT_NAMESPACE

    if (!NAMESPACE_PATTERN.test(namespace)) {
      return NextResponse.json(
        { error: "Namespace must be lowercase letters, numbers, - or _ (max 40 chars)" },
        { status: 400 }
      )
    }

    const key = generateKey()

    const { error } = await admin
      .from("license_keys")
      .insert({ key, created_by: user.id, namespace })

    if (error) {
      console.error("[v0] Key insert error:", error)
      return NextResponse.json({ error: "Failed to generate key" }, { status: 500 })
    }

    return NextResponse.json({ key, namespace })
  } catch (err) {
    console.error("[v0] Unexpected error in /api/license/generate:", err)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
