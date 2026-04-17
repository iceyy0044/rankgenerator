import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    // Use the cookie-based client only for auth verification
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const key = typeof body?.key === "string" ? body.key.trim() : ""
    if (!key) {
      return NextResponse.json({ error: "License key is required" }, { status: 400 })
    }

    // Use admin client for all DB operations to bypass RLS
    const admin = createAdminClient()

    // Check key exists, is active, and unclaimed
    const { data: licenseData, error: licenseError } = await admin
      .from("license_keys")
      .select("key, is_active, used_by")
      .eq("key", key)
      .single()

    if (licenseError || !licenseData) {
      return NextResponse.json({ error: "Invalid license key" }, { status: 400 })
    }
    if (!licenseData.is_active) {
      return NextResponse.json({ error: "This license key has been deactivated" }, { status: 400 })
    }
    if (licenseData.used_by) {
      return NextResponse.json({ error: "This license key has already been used" }, { status: 400 })
    }

    // Check user doesn't already have a license
    const { data: profileData } = await admin
      .from("profiles")
      .select("license_key")
      .eq("id", user.id)
      .single()

    if (profileData?.license_key) {
      return NextResponse.json({ error: "Your account already has an active license" }, { status: 400 })
    }

    // Mark license as claimed
    const { error: updateLicenseError } = await admin
      .from("license_keys")
      .update({ used_by: user.id, used_at: new Date().toISOString() })
      .eq("key", key)
      .is("used_by", null) // extra guard against race condition

    if (updateLicenseError) {
      console.error("[v0] License update error:", updateLicenseError)
      return NextResponse.json({ error: "Failed to claim license key" }, { status: 500 })
    }

    // Link license to user profile
    const { error: profileError } = await admin
      .from("profiles")
      .update({ license_key: key })
      .eq("id", user.id)

    if (profileError) {
      console.error("[v0] Profile update error:", profileError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[v0] Unexpected error in /api/license/validate:", err)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
