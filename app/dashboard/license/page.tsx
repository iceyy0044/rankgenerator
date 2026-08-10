import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LicenseGate from "@/components/dashboard/license-gate"
import LicensePageClient from "@/components/dashboard/license-page"
import { resolveAccess } from "@/lib/access"

export default async function LicensePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, license_key, discord_id, developer_discord_id")
    .eq("id", user.id)
    .single()

  const admin = createAdminClient()
  const access = await resolveAccess(admin, profile ?? { role: "user", license_key: null, discord_id: null })

  if (!access.hasAccess) {
    return <LicenseGate />
  }

  // This page is for license owners only — developers (and admins without
  // their own license) are sent back to the generator.
  if (!access.isOwner) {
    redirect("/dashboard")
  }

  const { data: licenseRow } = await admin
    .from("license_keys")
    .select("key, is_active, used_at, created_at")
    .eq("key", access.licenseKey)
    .single()

  return (
    <LicensePageClient
      licenseKey={access.licenseKey}
      isActive={licenseRow?.is_active ?? true}
      activatedAt={licenseRow?.used_at ?? null}
      developerDiscordId={profile?.developer_discord_id ?? null}
    />
  )
}
