import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LicenseGate from "@/components/dashboard/license-gate"
import TagHistoryPage from "@/components/dashboard/tag-history-page"

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, license_key")
    .eq("id", user.id)
    .single()

  const hasAccess = profile?.license_key || profile?.role === "admin"

  if (!hasAccess) {
    return <LicenseGate />
  }

  return <TagHistoryPage />
}
