import { NextResponse } from "next/server";
import { RANK_TAG_STYLES_SERVER } from "@/lib/rank-tag-config.server";
import * as Jimp from "jimp";
import fs from "fs/promises";
import path from "path";

const API_SECRET_KEY = "a1b2c3d4-e5f6-7890-1234-567890abcdef"; // This should be in an environment variable

async function readImageAsBuffer(filePath: string): Promise<Buffer> {
    const absolutePath = path.join(process.cwd(), "public", filePath);
    try {
        await fs.access(absolutePath);
        const fileBuffer = await fs.readFile(absolutePath);
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

async function tintImage(image: Jimp, color: { r: number, g: number, b: number }): Promise<Jimp> {
    // Create a tint layer by colorizing a white image
    const tintLayer = new Jimp(image.getWidth(), image.getHeight(), 0xffffffff);
    tintLayer.color([{ apply: 'red', params: [color.r] }, { apply: 'green', params: [color.g] }, { apply: 'blue', params: [color.b] }]);

    // Create a copy of the original image to use as a mask
    const mask = image.clone();

    // Apply the tint
    return image.composite(tintLayer, 0, 0, {
        mode: Jimp.BLEND_MULTIPLY,
        opacitySource: 1,
        opacityDest: 1
    }).mask(mask, 0, 0);
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
        
        const [leftImg, midImg, rightImg, fontSheet] = await Promise.all([
            Jimp.read(await readImageAsBuffer(style.leftUrl)),
            Jimp.read(await readImageAsBuffer(style.middleUrl)),
            Jimp.read(await readImageAsBuffer(style.rightUrl)),
            Jimp.read(await readImageAsBuffer(FONT_SHEET_PATH))
        ]);

        const [leftTinted, midTinted, rightTinted] = await Promise.all([
            tintImage(leftImg, selectedRgb),
            tintImage(midImg, selectedRgb),
            tintImage(rightImg, selectedRgb),
        ]);

        const charCount = text.length;
        const leftW = leftTinted.getWidth();
        const midW = midTinted.getWidth();
        const rightW = rightTinted.getWidth();
        const tileH = leftTinted.getHeight();
        const totalW = leftW + charCount * midW + rightW;

        const finalImage = new Jimp(totalW, tileH, 0x00000000); // Transparent background

        finalImage.composite(leftTinted, 0, 0);
        for (let i = 0; i < charCount; i++) {
            finalImage.composite(midTinted, leftW + i * midW, 0);
        }
        finalImage.composite(rightTinted, leftW + charCount * midW, 0);

        for (let i = 0; i < charCount; i++) {
            const ch = text[i];
            const fontChar = FONT_MAP[ch];
            if (!fontChar) continue;

            const cx = leftW + i * midW + Math.floor((midW - CHAR_WIDTH) / 2);
            const textY = Math.floor((tileH - CHAR_HEIGHT) / 2);

            const charImg = fontSheet.clone().crop(fontChar.x, fontChar.y, CHAR_WIDTH, CHAR_HEIGHT);

            // Shadow
            const shadowImg = charImg.clone().color([{ apply: 'red', params: [0] }, { apply: 'green', params: [0] }, { apply: 'blue', params: [0] }]).opacity(0.55);
            finalImage.composite(shadowImg, cx + 1, textY + 1);

            // Main glyph with tint
            const baseRgb = { r: 205, g: 205, b: 205 };
            const mixedRgb = {
                r: Math.round(baseRgb.r * 0.8 + selectedRgb.r * 0.2),
                g: Math.round(baseRgb.g * 0.8 + selectedRgb.g * 0.2),
                b: Math.round(baseRgb.b * 0.8 + selectedRgb.b * 0.2),
            };
            
            const glyphTint = new Jimp(CHAR_WIDTH, 3, 0x000000ff).color([{apply: 'red', params: [mixedRgb.r]}, {apply: 'green', params: [mixedRgb.g]}, {apply: 'blue', params: [mixedRgb.b]}]).opacity(0.4);
            const glyphBuffer = charImg.clone().color([{ apply: 'red', params: [255] }, { apply: 'green', params: [255] }, { apply: 'blue', params: [255] }]).composite(glyphTint, 0, CHAR_HEIGHT - 3);

            finalImage.composite(glyphBuffer, cx + 1, textY);
        }

        const finalBuffer = await finalImage.getBufferAsync(Jimp.MIME_PNG);

        return new NextResponse(finalBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Disposition': `attachment; filename="${text || 'rank'}.png"`,
            },
        });

    } catch (error) {
        console.error("Error generating tag:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return NextResponse.json({ error: "An unexpected error occurred while generating the tag.", details: errorMessage }, { status: 500 });
    }
}
