import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  let activeProfile = profile;

  // If no profile yet (trigger might be slow), create one
  if (!profile) {
    const { data: newProfile, error } = await supabase.from("profiles").insert({
      id: user.id,
      discord_username: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role: "user",
    }).select().single();

    if (error) {
      // Handle error appropriately
      console.error("Error creating profile:", error);
      // maybe redirect to an error page
      redirect("/error");
    }
    activeProfile = newProfile;
  }

  // If profile exists but no license key, redirect to license entry
  const finalProfile = activeProfile ?? { role: "user", license_key: null }

  if (!finalProfile.license_key && finalProfile.role !== "admin") {
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
        role: (finalProfile.role as "user" | "admin") ?? "user",
        hasLicense: !!finalProfile.license_key,
      }}
    >
      {children}
    </DashboardShell>
  )
}
