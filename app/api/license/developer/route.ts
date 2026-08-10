import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const DISCORD_ID_PATTERN = /^\d{17,20}$/

async function getOwnerProfile(userId: string) {
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("license_key, developer_discord_id")
    .eq("id", userId)
    .single()
  return { admin, profile }
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

  const body = await req.json()
  const discordId = typeof body?.discordId === "string" ? body.discordId.trim() : ""

  if (!DISCORD_ID_PATTERN.test(discordId)) {
    return NextResponse.json({ error: "Enter a valid Discord user ID (17–20 digits)" }, { status: 400 })
  }

  const { admin, profile } = await getOwnerProfile(user.id)

  if (!profile?.license_key) {
    return NextResponse.json({ error: "Only license owners can add a developer" }, { status: 403 })
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ developer_discord_id: discordId })
    .eq("id", user.id)

  if (updateError) {
    return NextResponse.json({ error: "Failed to save developer ID" }, { status: 500 })
  }

  return NextResponse.json({ success: true, developerDiscordId: discordId })
}

export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { admin, profile } = await getOwnerProfile(user.id)

  if (!profile?.license_key) {
    return NextResponse.json({ error: "Only license owners can manage a developer" }, { status: 403 })
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ developer_discord_id: null })
    .eq("id", user.id)

  if (updateError) {
    return NextResponse.json({ error: "Failed to remove developer" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
