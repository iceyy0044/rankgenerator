import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LicenseGate from "@/components/dashboard/license-gate"
import TagHistoryPage from "@/components/dashboard/tag-history-page"
import { resolveAccess } from "@/lib/access"

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, license_key, discord_id")
    .eq("id", user.id)
    .single()

  const access = await resolveAccess(createAdminClient(), profile ?? { role: "user", license_key: null, discord_id: null })

  if (!access.hasAccess) {
    return <LicenseGate />
  }

  return <TagHistoryPage />
}
