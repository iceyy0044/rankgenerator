import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LicenseGate from "@/components/dashboard/license-gate"
import RankTagGenerator from "@/components/dashboard/rank-tag-generator"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  return <RankTagGenerator />
}
