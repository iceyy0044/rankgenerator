import type { SupabaseClient } from "@supabase/supabase-js"

interface ProfileForAccess {
  role: string | null
  license_key: string | null
  discord_id: string | null
}

export type AccessResult =
  | { hasAccess: false; isOwner: false; isDeveloper: false }
  | { hasAccess: true; isOwner: true; isDeveloper: false; licenseKey: string }
  | { hasAccess: true; isOwner: false; isDeveloper: true; licenseKey: string; ownerId: string }
  | { hasAccess: true; isOwner: false; isDeveloper: false; licenseKey: null }

/**
 * Resolves whether a user can use the generator: owning a license, holding the
 * admin role, or being the one developer a license owner invited by Discord ID.
 * The developer lookup crosses RLS (reads another user's profile row), so it
 * needs a service-role client — only call this after the caller is authenticated.
 */
export async function resolveAccess(admin: SupabaseClient, profile: ProfileForAccess): Promise<AccessResult> {
  if (profile.license_key) {
    return { hasAccess: true, isOwner: true, isDeveloper: false, licenseKey: profile.license_key }
  }

  if (profile.role === "admin") {
    return { hasAccess: true, isOwner: false, isDeveloper: false, licenseKey: null }
  }

  if (profile.discord_id) {
    const { data: owner } = await admin
      .from("profiles")
      .select("id, license_key")
      .eq("developer_discord_id", profile.discord_id)
      .not("license_key", "is", null)
      .limit(1)
      .maybeSingle()

    if (owner?.license_key) {
      return { hasAccess: true, isOwner: false, isDeveloper: true, licenseKey: owner.license_key, ownerId: owner.id as string }
    }
  }

  return { hasAccess: false, isOwner: false, isDeveloper: false }
}
