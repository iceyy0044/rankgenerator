import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// It's recommended to use an API key to protect this endpoint from abuse.
// const API_SECRET_KEY = process.env.PLUGIN_API_SECRET;

// Resources that don't send a namespace (the original plugin predates this
// field) are treated as the original product, so existing integrations keep
// working unchanged.
const DEFAULT_NAMESPACE = "samsranks";

export async function POST(req: NextRequest) {
  try {
    // Uncomment the following lines to enable API key authentication
    // const authHeader = req.headers.get("Authorization");
    // if (authHeader !== `Bearer ${API_SECRET_KEY}`) {
    //   return NextResponse.json({ valid: false, error: "Unauthorized" }, { status: 401 });
    // }

    const body = await req.json();
    const { discord_username, license_key } = body;
    const namespace =
      typeof body.namespace === "string" && body.namespace.trim()
        ? body.namespace.trim().toLowerCase()
        : DEFAULT_NAMESPACE;

    if (!discord_username || !license_key) {
      return NextResponse.json(
        { valid: false, error: "Missing discord_username or license_key" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

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

    // Fetch the license itself to check it's active and scoped to this resource
    const { data: licenseData, error: licenseError } = await supabase
      .from("license_keys")
      .select("is_active, namespace")
      .eq("key", license_key)
      .single();

    if (licenseError || !licenseData) {
      return NextResponse.json(
        { valid: false, error: "License key not found." },
        { status: 404 }
      );
    }

    if (!licenseData.is_active) {
      return NextResponse.json(
        { valid: false, error: "This license key has been deactivated." },
        { status: 403 }
      );
    }

    if (licenseData.namespace !== namespace) {
      return NextResponse.json(
        { valid: false, error: `This license is not valid for "${namespace}".` },
        { status: 403 }
      );
    }

    // IP locking logic
    const { data: ipData, error: ipError } = await supabase
      .from("license_ips")
      .select("ip_address")
      .eq("license_key", license_key);

    if (ipError) {
      return NextResponse.json(
        { valid: false, error: "Failed to retrieve IP data." },
        { status: 500 }
      );
    }

    const registeredIps = ipData.map((row) => row.ip_address);

    if (!registeredIps.includes(ip)) {
      if (registeredIps.length >= 3) {
        return NextResponse.json(
          {
            valid: false,
            error:
              "You've reached the IP limit of 3, either make a ticket to reset ur IPs or request additional IP slots in case you are a bigger network.",
          },
          { status: 429 }
        );
      }

      const { error: insertIpError } = await supabase
        .from("license_ips")
        .insert({ license_key, ip_address: ip });

      if (insertIpError) {
        return NextResponse.json(
          { valid: false, error: "Failed to register new IP." },
          { status: 500 }
        );
      }
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
