import { NextResponse } from "next/server";
import { RANK_TAG_STYLES_SERVER } from "@/lib/rank-tag-config.server";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const API_SECRET_KEY = "a1b2c3d4-e5f6-7890-1234-567890abcdef"; // This should be in an environment variable

// --- New Local File Reading Function ---
async function readImageAsBuffer(filePath: string): Promise<Buffer> {
    // Resolve path by joining the project root with 'public' and the relative file path
    const absolutePath = path.join(process.cwd(), "public", filePath);
    try {
        await fs.access(absolutePath);
    } catch (error) {
        console.error(`File not found at path: ${absolutePath}`);
        throw new Error(`File not found: ${filePath}. Resolved path: ${absolutePath}`);
    }

    try {
        const fileBuffer = await fs.readFile(absolutePath);
        // NEW: Log the size of the buffer to verify it's not empty
        console.log(`Buffer size for ${filePath}: ${fileBuffer.length}`);
        return fileBuffer;
    } catch (error: any) {
        console.error(`Error reading file: ${filePath} at ${absolutePath}`, error);
        throw new Error(`Could not read image from ${filePath}. Error: ${error.message}`);
    }
}

// --- Bitmap Font Configuration ---
const FONT_MAP: { [key: string]: { x: number; y: number } } = {
    'A': { x: 0, y: 0 }, 'B': { x: 8, y: 0 }, 'C': { x: 16, y: 0 }, 'D': { x: 24, y: 0 },
    'E': { x: 32, y: 0 }, 'F': { x: 40, y: 0 }, 'G': { x: 48, y: 0 }, 'H': { x: 56, y: 0 },
    'I': { x: 64, y: 0 }, 'J': { x: 72, y: 0 }, 'K': { x: 80, y: 0 }, 'L': { x: 88, y: 0 },
    'M': { x: 96, y: 0 }, 'N': { x: 104, y: 0 }, 'O': { x: 112, y: 0 }, 'P': { x: 120, y: 0 },
    'Q': { x: 0, y: 8 }, 'R': { x: 8, y: 8 }, 'S': { x: 16, y: 8 }, 'T': { x: 24, y: 8 },
    'U': { x: 32, y: 8 }, 'V': { x: 40, y: 8 }, 'W': { x: 48, y: 8 }, 'X': { x: 56, y: 8 },
    'Y': { x: 64, y: 8 }, 'Z': { x: 72, y: 8 }, '_': { x: 80, y: 8}, '-': { x: 88, y: 8}, '.': { x: 96, y: 8}, ' ': { x: 104, y: 8}, '+': { x: 112, y: 8}, '!': { x: 120, y: 8},
    '0': { x: 0, y: 16 }, '1': { x: 8, y: 16 }, '2': { x: 16, y: 16 }, '3': { x: 24, y: 16 },
    '4': { x: 32, y: 16 }, '5': { x: 40, y: 16 }, '6': { x: 48, y: 16 }, '7': { x: 56, y: 16 },
    '8': { x: 64, y: 16 }, '9': { x: 72, y: 16 }
};
const CHAR_WIDTH = 7;
const CHAR_HEIGHT = 7;
const ALLOWED_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-.+! ";
const FONT_SHEET_PATH = "rank-tag-tiles/font_sheet.png";

function hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

async function tintImage(imageBuffer: Buffer, color: { r: number, g: number, b: number }) {
    // "Sanitize" the input buffer by decoding and re-encoding it.
    // This normalizes the image data and can fix issues with specific PNG formats.
    const sanitizedBuffer = await sharp(imageBuffer).png().toBuffer();

    const image = sharp(sanitizedBuffer);
    const { width, height } = await image.metadata();

    if (!width || !height) {
        throw new Error("Could not get image metadata after sanitization");
    }

    const tintLayer = sharp({
        create: {
            width,
            height,
            channels: 3,
            background: color,
        },
    });

    const tinted = await image
        .composite([
            { input: await tintLayer.toBuffer(), blend: 'dest-in' },
            // IMPORTANT: Use the sanitized buffer for the multiply blend as well
            { input: sanitizedBuffer, blend: 'multiply' }
        ])
        .toBuffer();

    return tinted;
}

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (authHeader !== `Bearer ${API_SECRET_KEY}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const text = (searchParams.get("text") || "ADMIN").toUpperCase().slice(0, 15);
        let color = (searchParams.get("color") || "random").toLowerCase();
        const styleId = searchParams.get("style") || "classic";

        for (const char of text) {
            if (!ALLOWED_CHARS.includes(char)) {
                return NextResponse.json({
                    error: `Invalid character '${char}' in text.`,
                    allowed_characters: ALLOWED_CHARS.split('')
                }, { status: 400 });
            }
        }

        if (color === "random") {
            color = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        } else if (!/^#[0-9a-f]{6}$/i.test(color)) {
            return NextResponse.json({ error: "Invalid color format. Use a 6-digit hex code (e.g., #FF0000)." }, { status: 400 });
        }

        const selectedRgb = hexToRgb(color);

        const style = RANK_TAG_STYLES_SERVER.find(s => s.id === styleId);
        if (!style) {
            return NextResponse.json({ error: `Style '${styleId}' not found.` }, { status: 400 });
        }
        
        const [leftImgBuffer, midImgBuffer, rightImgBuffer, fontSheetBuffer] = await Promise.all([
            readImageAsBuffer(style.leftUrl),
            readImageAsBuffer(style.middleUrl),
            readImageAsBuffer(style.rightUrl),
            readImageAsBuffer(FONT_SHEET_PATH)
        ]);

        const [leftTinted, midTinted, rightTinted] = await Promise.all([
            tintImage(leftImgBuffer, selectedRgb),
            tintImage(midImgBuffer, selectedRgb),
            tintImage(rightImgBuffer, selectedRgb),
        ]);

        const leftMeta = await sharp(leftTinted).metadata();
        const midMeta = await sharp(midTinted).metadata();

        const charCount = text.length;
        const leftW = leftMeta.width!;
        const midW = midMeta.width!;
        const rightW = (await sharp(rightTinted).metadata()).width!;
        const tileH = leftMeta.height!;
        const totalW = leftW + charCount * midW + rightW;

        const compositeLayers: sharp.OverlayOptions[] = [];

        compositeLayers.push({ input: leftTinted, top: 0, left: 0 });
        for (let i = 0; i < charCount; i++) {
            compositeLayers.push({ input: midTinted, top: 0, left: leftW + i * midW });
        }
        compositeLayers.push({ input: rightTinted, top: 0, left: leftW + charCount * midW });

        const fontSheet = sharp(fontSheetBuffer);

        for (let i = 0; i < charCount; i++) {
            const ch = text[i];
            const fontChar = FONT_MAP[ch];
            if (!fontChar) continue;

            const cx = leftW + i * midW + Math.floor((midW - CHAR_WIDTH) / 2);
            const textY = Math.floor((tileH - CHAR_HEIGHT) / 2);

            const charImg = await fontSheet.clone().extract({ left: fontChar.x, top: fontChar.y, width: CHAR_WIDTH, height: CHAR_HEIGHT }).toBuffer();

            // Shadow
            const shadowBuffer = await sharp(charImg).composite([{
                input: Buffer.from([0, 0, 0, 140]), // approx 0.55 alpha
                raw: { width: 1, height: 1, channels: 4 },
                tile: true,
                blend: 'in'
            }]).toBuffer();
            compositeLayers.push({ input: shadowBuffer, top: textY + 1, left: cx + 1 });

            // Main glyph with tint
            const baseRgb = { r: 205, g: 205, b: 205 };
            const mixedRgb = {
                r: Math.round(baseRgb.r * 0.8 + selectedRgb.r * 0.2),
                g: Math.round(baseRgb.g * 0.8 + selectedRgb.b * 0.2),
                b: Math.round(baseRgb.b * 0.8 + selectedRgb.b * 0.2),
            };

            const glyphTint = await sharp({ create: { width: CHAR_WIDTH, height: 3, channels: 4, background: { r: mixedRgb.r, g: mixedRgb.g, b: mixedRgb.b, alpha: 0.4 } } }).toBuffer();

            const glyphBuffer = await sharp(charImg)
                .composite([
                    { input: Buffer.from([255, 255, 255, 255]), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: 'in' },
                    { input: glyphTint, top: CHAR_HEIGHT - 3, left: 0, blend: 'atop' }
                ])
                .toBuffer();

            compositeLayers.push({ input: glyphBuffer, top: textY, left: cx + 1 });
        }

        const finalImage = await sharp({
            create: {
                width: totalW,
                height: tileH,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        })
        .composite(compositeLayers)
        .png()
        .toBuffer();

        return new NextResponse(finalImage, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Disposition': `attachment; filename="${text || 'rank'}.png"`,
            },
        });

    } catch (error) {
        console.error("Error generating tag:", error);
        return NextResponse.json({ error: "An unexpected error occurred while generating the tag." }, { status: 500 });
    }
}
