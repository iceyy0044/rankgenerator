import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { discord_username, license_key } = body;

    if (!discord_username || !license_key) {
      return NextResponse.json(
        { valid: false, error: "Missing discord_username or license_key" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch the profile associated with the Discord username
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("license_key")
      .eq("discord_username", discord_username)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json(
        { valid: false, error: "Profile not found for the given Discord username." },
        { status: 404 }
      );
    }

    // Check if the provided license key matches the one in the user's profile
    if (profileData.license_key !== license_key) {
      return NextResponse.json(
        { valid: false, error: "License key does not match the user's profile." },
        { status: 403 }
      );
    }

    // If all checks pass, the license is valid for this user.
    return NextResponse.json({ valid: true });
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
