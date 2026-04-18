import { createCanvas, loadImage } from "canvas";
import { NextResponse } from "next/server";
import { RANK_TAG_STYLES, RankTagStyle } from "@/lib/rank-tag-config";
import path from "path";
import fs from "fs/promises";

const API_SECRET_KEY = "a1b2c3d4-e5f6-7890-1234-567890abcdef"; // This should be in an environment variable

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
const FONT_SHEET_PATH = path.join(process.cwd(), "public", "font_sheet.png");


function hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function tintImageData(ctx: any, image: any, x: number, y: number, w: number, h: number, rgb: { r: number, g: number, b: number }) {
    const tempCanvas = createCanvas(w, h);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.imageSmoothingEnabled = false;

    tempCtx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    tempCtx.fillRect(0, 0, w, h);

    tempCtx.globalCompositeOperation = "destination-in";
    tempCtx.drawImage(image, 0, 0, w, h);

    tempCtx.globalCompositeOperation = "multiply";
    tempCtx.drawImage(image, 0, 0, w, h);

    ctx.drawImage(tempCanvas, x, y, w, h);
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

        // Validate text
        for (const char of text) {
            if (!ALLOWED_CHARS.includes(char)) {
                return NextResponse.json({
                    error: `Invalid character '${char}' in text.`,
                    allowed_characters: ALLOWED_CHARS.split('')
                }, { status: 400 });
            }
        }

        // Handle color
        if (color === "random") {
            color = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        } else if (!/^#[0-9a-f]{6}$/i.test(color)) {
            return NextResponse.json({ error: "Invalid color format. Use a 6-digit hex code (e.g., #FF0000)." }, { status: 400 });
        }

        const selectedRgb = hexToRgb(color);

        // Get style
        const style = RANK_TAG_STYLES.find(s => s.id === styleId);
        if (!style) {
            return NextResponse.json({ error: `Style '${styleId}' not found.` }, { status: 400 });
        }

        // Load assets
        const [leftImg, midImg, rightImg, fontSheet] = await Promise.all([
            loadImage(path.join(process.cwd(), "public", style.leftUrl)),
            loadImage(path.join(process.cwd(), "public", style.middleUrl)),
            loadImage(path.join(process.cwd(), "public", style.rightUrl)),
            loadImage(FONT_SHEET_PATH)
        ]);

        const charCount = text.length;
        const leftW = leftImg.width;
        const midW = midImg.width;
        const rightW = rightImg.width;
        const tileH = leftImg.height;
        const totalW = leftW + charCount * midW + rightW;

        const canvas = createCanvas(totalW, tileH);
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;

        // Render background tiles
        tintImageData(ctx, leftImg, 0, 0, leftW, tileH, selectedRgb);
        for (let i = 0; i < charCount; i++) {
            const x = leftW + i * midW;
            tintImageData(ctx, midImg, x, 0, midW, tileH, selectedRgb);
        }
        const rightX = leftW + charCount * midW;
        tintImageData(ctx, rightImg, rightX, 0, rightW, tileH, selectedRgb);

        // Render text with shadow
        for (let i = 0; i < charCount; i++) {
            const ch = text[i];
            const fontChar = FONT_MAP[ch];
            if (!fontChar) continue;

            const cx = leftW + i * midW + Math.floor((midW - CHAR_WIDTH) / 2);
            const textY = Math.floor((tileH - CHAR_HEIGHT) / 2);

            // Shadow
            const shadowCtx = createCanvas(CHAR_WIDTH, CHAR_HEIGHT).getContext("2d");
            shadowCtx.drawImage(fontSheet, fontChar.x, fontChar.y, CHAR_WIDTH, CHAR_HEIGHT, 0, 0, CHAR_WIDTH, CHAR_HEIGHT);
            shadowCtx.globalCompositeOperation = 'source-in';
            shadowCtx.fillStyle = 'rgba(0,0,0,0.55)';
            shadowCtx.fillRect(0, 0, CHAR_WIDTH, CHAR_HEIGHT);
            ctx.drawImage(shadowCtx.canvas, cx + 1, textY + 1);

            // Main glyph
            const glyphCtx = createCanvas(CHAR_WIDTH, CHAR_HEIGHT).getContext("2d");
            glyphCtx.drawImage(fontSheet, fontChar.x, fontChar.y, CHAR_WIDTH, CHAR_HEIGHT, 0, 0, CHAR_WIDTH, CHAR_HEIGHT);
            glyphCtx.globalCompositeOperation = 'source-in';
            glyphCtx.fillStyle = '#ffffff';
            glyphCtx.fillRect(0, 0, CHAR_WIDTH, CHAR_HEIGHT);

            // Glyph tint
            const baseRgb = { r: 205, g: 205, b: 205 };
            const mixedRgb = {
                r: Math.round(baseRgb.r * 0.8 + selectedRgb.r * 0.2),
                g: Math.round(baseRgb.g * 0.8 + selectedRgb.g * 0.2),
                b: Math.round(baseRgb.b * 0.8 + selectedRgb.b * 0.2),
            };
            glyphCtx.globalCompositeOperation = 'source-atop';
            glyphCtx.fillStyle = `rgba(${mixedRgb.r}, ${mixedRgb.g}, ${mixedRgb.b}, 0.4)`;
            glyphCtx.fillRect(0, CHAR_HEIGHT - 3, CHAR_WIDTH, 3);

            ctx.drawImage(glyphCtx.canvas, cx + 1, textY);
        }

        const buffer = canvas.toBuffer("image/png");

        return new NextResponse(buffer, {
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
