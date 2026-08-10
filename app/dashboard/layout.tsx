import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardShell from "@/components/dashboard/shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const discordId =
    user.identities?.find((i) => i.provider === "discord")?.id ??
    user.user_metadata?.provider_id ??
    user.user_metadata?.sub ??
    null

  // If no profile yet (trigger might be slow), create one
  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      discord_username: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      discord_id: discordId,
      role: "user",
    })
  } else if (!profile.discord_id && discordId) {
    // Backfill for accounts created before discord_id was tracked
    await supabase.from("profiles").update({ discord_id: discordId }).eq("id", user.id)
  }

  // If profile exists but no license key, redirect to license entry
  const activeProfile = profile ?? { role: "user", license_key: null }

  if (!activeProfile.license_key && activeProfile.role !== "admin") {
    // Check if the path is already the license page
    // We'll handle this redirect in the page itself
  }

  return (
    <DashboardShell
      user={{
        id: user.id,
        email: user.email ?? "",
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "User",
        avatar: user.user_metadata?.avatar_url ?? null,
        role: (activeProfile.role as "user" | "admin") ?? "user",
        hasLicense: !!activeProfile.license_key,
      }}
    >
      {children}
    </DashboardShell>
  )
}
