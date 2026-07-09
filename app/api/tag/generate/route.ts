import { NextResponse } from "next/server";
import { RANK_TAG_STYLES_SERVER } from "@/lib/rank-tag-config.server";
import { MAX_TAG_TEXT_LENGTH, type TagConfiguration, type ColorMode } from "@/lib/tag-config-types";
import { DEFAULT_GRADIENT_COLORS, MAX_GRADIENT_COLORS, MIN_GRADIENT_COLORS, randomHexColor } from "@/lib/gradient-utils";
import { FONT_MAP } from "@/lib/rank-tag-render";
import { ICON_OPTIONS, normalizeIconId } from "@/lib/icon-sheet-config";
import { renderRankTagBuffer } from "@/lib/rank-tag-render.server";
import { createAdminClient } from "@/lib/supabase/server";

const ALLOWED_CHARS = Object.keys(FONT_MAP).join("");
const VALID_STYLE_IDS = RANK_TAG_STYLES_SERVER.map((s) => s.id);
const VALID_ICON_IDS = ICON_OPTIONS.map((i) => i.id);
const HEX_COLOR_RE = /^#?[0-9a-fA-F]{6}$/;

/**
 * `GET /api/tag/generate`
 *
 * Renders a rank tag as a PNG using the exact same styling engine as the
 * in-app editor — solid or multi-stop gradient fills (at any angle), any
 * template style, and an optional prefix icon with its own independent
 * background style / color overrides — and streams the image back.
 *
 * Every field the editor UI exposes has a matching query parameter here, so
 * any tag buildable in the editor is reproducible via a single URL.
 *
 * ## Auth
 * Requires `Authorization: Bearer <your license key>` — the same key used to
 * activate the dashboard (`profiles.license_key` via `license_keys`). The key
 * must exist, be active, and be claimed by a user.
 *
 * ## Query parameters
 *
 * | Param                | Type                  | Default    | Notes |
 * |-----------------------|-----------------------|------------|-------|
 * | `text`                | string                | `ADMIN`    | Max {@link MAX_TAG_TEXT_LENGTH} chars. Allowed: `A-Z 0-9 _ - . + !` and space. Automatically uppercased. |
 * | `style`               | string                | `classic`  | One of: `rounded`, `squared`, `extra-rounded`, `medieval`, `cartoon`, `classic`, `hourglass`, `legacy`, `modern`, `tapered`. |
 * | `colorMode`           | `solid` \| `gradient` | `solid`    | Fill mode for the tag background. |
 * | `color`               | hex or `random`       | `random`   | Used when `colorMode=solid`. |
 * | `gradientColors`      | comma-separated hex   | `#0051FF,#FFFFFF` | 2–6 colors. Used when `colorMode=gradient`. |
 * | `gradientAngle`       | number (degrees)      | `0`        | Used when `colorMode=gradient`. |
 * | `icon`                | string                | *(none)*   | Prefix icon id. Omit for no icon. See valid ids below. |
 * | `iconBgSync`          | `true` \| `false`     | `true`     | When true, the icon's background box uses `style`. |
 * | `iconStyle`           | string                | = `style`  | Icon background style id. Only used when `iconBgSync=false`. |
 * | `iconColorSync`       | `true` \| `false`     | `true`     | When true, the icon reuses the tag's color/gradient. |
 * | `iconColorMode`       | `solid` \| `gradient` | `solid`    | Only used when `iconColorSync=false`. |
 * | `iconColor`           | hex or `random`       | `random`   | Only used when `iconColorSync=false` and `iconColorMode=solid`. |
 * | `iconGradientColors`  | comma-separated hex   | `#0051FF,#FFFFFF` | Only used when `iconColorSync=false` and `iconColorMode=gradient`. |
 * | `iconGradientAngle`   | number (degrees)      | `0`        | Only used when `iconColorSync=false` and `iconColorMode=gradient`. |
 *
 * Valid icon ids: {@link ICON_OPTIONS} in `lib/icon-sheet-config.ts` (e.g.
 * `crown`, `shield`, `star`, `skull`, `compass`, ...). An invalid `style` or
 * `icon` value returns a 400 listing the accepted values.
 *
 * ## Examples
 * ```
 * /api/tag/generate?text=OWNER&style=medieval&color=%23ff0000
 * /api/tag/generate?text=VIP&colorMode=gradient&gradientColors=%23ff0000,%23ffff00&gradientAngle=45
 * /api/tag/generate?text=ADMIN&icon=crown&iconColorSync=false&iconColor=%23ffd700
 * ```
 *
 * ## Response
 * `200` with `Content-Type: image/png` and a `Content-Disposition` attachment
 * header on success. `400` with `{ error, details? }` JSON on invalid input,
 * `401` if unauthenticated, `500` on unexpected render failures.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const licenseKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!licenseKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: license, error: licenseError } = await admin
      .from("license_keys")
      .select("is_active, used_by")
      .eq("key", licenseKey)
      .single();

    if (licenseError || !license) {
      return NextResponse.json({ error: "Invalid license key" }, { status: 401 });
    }
    if (!license.is_active) {
      return NextResponse.json({ error: "This license key has been deactivated" }, { status: 401 });
    }
    if (!license.used_by) {
      return NextResponse.json({ error: "This license key has not been activated by a user yet" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // --- text -----------------------------------------------------------
    const text = (searchParams.get("text") || "ADMIN").toUpperCase().slice(0, MAX_TAG_TEXT_LENGTH);
    for (const char of text) {
      if (!ALLOWED_CHARS.includes(char)) {
        return NextResponse.json(
          {
            error: `Invalid character '${char}' in text.`,
            allowed_characters: ALLOWED_CHARS.split(""),
          },
          { status: 400 }
        );
      }
    }

    // --- style ------------------------------------------------------------
    const styleId = searchParams.get("style") || "classic";
    const style = RANK_TAG_STYLES_SERVER.find((s) => s.id === styleId);
    if (!style) {
      return NextResponse.json(
        { error: `Style '${styleId}' not found.`, valid_styles: VALID_STYLE_IDS },
        { status: 400 }
      );
    }

    // --- tag color / gradient ----------------------------------------------
    const colorMode = parseColorMode(searchParams.get("colorMode"), "colorMode");
    if (colorMode instanceof NextResponse) return colorMode;

    const color = parseColor(searchParams.get("color"), "color");
    if (color instanceof NextResponse) return color;

    const gradientColors = parseGradientColors(searchParams.get("gradientColors"), "gradientColors");
    if (gradientColors instanceof NextResponse) return gradientColors;

    const gradientAngle = parseAngle(searchParams.get("gradientAngle"), "gradientAngle");
    if (gradientAngle instanceof NextResponse) return gradientAngle;

    // --- prefix icon --------------------------------------------------------
    const rawIcon = searchParams.get("icon");
    const iconId = rawIcon ? normalizeIconId(rawIcon) : null;
    if (rawIcon && !iconId) {
      return NextResponse.json(
        { error: `Icon '${rawIcon}' not found.`, valid_icons: VALID_ICON_IDS },
        { status: 400 }
      );
    }

    const iconBgSync = parseBool(searchParams.get("iconBgSync"), "iconBgSync", true);
    if (iconBgSync instanceof NextResponse) return iconBgSync;

    const iconStyleId = searchParams.get("iconStyle") || styleId;
    if (!RANK_TAG_STYLES_SERVER.some((s) => s.id === iconStyleId)) {
      return NextResponse.json(
        { error: `Icon style '${iconStyleId}' not found.`, valid_styles: VALID_STYLE_IDS },
        { status: 400 }
      );
    }

    const iconColorSync = parseBool(searchParams.get("iconColorSync"), "iconColorSync", true);
    if (iconColorSync instanceof NextResponse) return iconColorSync;

    const iconColorMode = parseColorMode(searchParams.get("iconColorMode"), "iconColorMode");
    if (iconColorMode instanceof NextResponse) return iconColorMode;

    const iconColor = parseColor(searchParams.get("iconColor"), "iconColor");
    if (iconColor instanceof NextResponse) return iconColor;

    const iconGradientColors = parseGradientColors(searchParams.get("iconGradientColors"), "iconGradientColors");
    if (iconGradientColors instanceof NextResponse) return iconGradientColors;

    const iconGradientAngle = parseAngle(searchParams.get("iconGradientAngle"), "iconGradientAngle");
    if (iconGradientAngle instanceof NextResponse) return iconGradientAngle;

    const config: TagConfiguration = {
      text,
      styleId,
      colorMode,
      color,
      gradientColors,
      gradientAngle,
      iconId,
      iconBgSync,
      iconStyleId,
      iconColorSync,
      iconColorMode,
      iconColor,
      iconGradientColors,
      iconGradientAngle,
    };

    const pngBuffer = await renderRankTagBuffer(config, style);

    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${text || "rank"}.png"`,
      },
    });
  } catch (error) {
    console.error("Error generating tag:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json(
      { error: "An unexpected error occurred while generating the tag.", details: errorMessage },
      { status: 500 }
    );
  }
}

/** Resolves a hex color param, treating `"random"` (or a missing value) as a random color. */
function parseColor(raw: string | null, field: string): string | NextResponse {
  if (!raw || raw.toLowerCase() === "random") return randomHexColor();
  if (!HEX_COLOR_RE.test(raw)) {
    return NextResponse.json(
      { error: `Invalid '${field}'. Use a 6-digit hex code (e.g. #FF0000) or "random".` },
      { status: 400 }
    );
  }
  return raw.startsWith("#") ? raw : `#${raw}`;
}

function parseColorMode(raw: string | null, field: string): ColorMode | NextResponse {
  if (!raw) return "solid";
  if (raw === "solid" || raw === "gradient") return raw;
  return NextResponse.json({ error: `Invalid '${field}'. Must be "solid" or "gradient".` }, { status: 400 });
}

/** Parses a comma-separated hex color list (2-6 colors); missing value falls back to the default gradient. */
function parseGradientColors(raw: string | null, field: string): string[] | NextResponse {
  if (!raw) return [...DEFAULT_GRADIENT_COLORS];
  const parts = raw.split(",").map((c) => c.trim()).filter(Boolean);
  if (parts.length < MIN_GRADIENT_COLORS || parts.length > MAX_GRADIENT_COLORS) {
    return NextResponse.json(
      { error: `Invalid '${field}'. Provide ${MIN_GRADIENT_COLORS}-${MAX_GRADIENT_COLORS} comma-separated hex colors.` },
      { status: 400 }
    );
  }
  const normalized: string[] = [];
  for (const part of parts) {
    if (!HEX_COLOR_RE.test(part)) {
      return NextResponse.json(
        { error: `Invalid color '${part}' in '${field}'. Use 6-digit hex codes (e.g. #FF0000).` },
        { status: 400 }
      );
    }
    normalized.push(part.startsWith("#") ? part : `#${part}`);
  }
  return normalized;
}

function parseAngle(raw: string | null, field: string): number | NextResponse {
  if (!raw) return 0;
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return NextResponse.json({ error: `Invalid '${field}'. Must be a number.` }, { status: 400 });
  }
  return n;
}

function parseBool(raw: string | null, field: string, defaultValue: boolean): boolean | NextResponse {
  if (raw === null) return defaultValue;
  const lower = raw.toLowerCase();
  if (lower === "true") return true;
  if (lower === "false") return false;
  return NextResponse.json({ error: `Invalid '${field}'. Must be "true" or "false".` }, { status: 400 });
}
