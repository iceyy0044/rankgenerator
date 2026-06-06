"use client"

import type { ColorMode } from "@/lib/tag-config-types"

const PRESET_COLORS = ["#e3e2a0", "#a1d59f", "#f7cfb1", "#DD3838", "#5E719E"]

interface TagColorControlsProps {
  colorMode: ColorMode
  color: string
  gradientStart: string
  gradientEnd: string
  gradientAngle: number
  onColorModeChange: (mode: ColorMode) => void
  onColorChange: (color: string) => void
  onGradientStartChange: (color: string) => void
  onGradientEndChange: (color: string) => void
  onGradientAngleChange: (angle: number) => void
  solidLabel?: string
}

export default function TagColorControls({
  colorMode,
  color,
  gradientStart,
  gradientEnd,
  gradientAngle,
  onColorModeChange,
  onColorChange,
  onGradientStartChange,
  onGradientEndChange,
  onGradientAngleChange,
  solidLabel = "Background Tint Color",
}: TagColorControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider">Color Mode</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onColorModeChange("solid")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              colorMode === "solid"
                ? "bg-[#fbbf24] text-black"
                : "bg-[#1e1706] text-[#e8eaf0] hover:bg-[#2a2108]"
            }`}
          >
            Solid
          </button>
          <button
            onClick={() => onColorModeChange("gradient")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              colorMode === "gradient"
                ? "bg-[#fbbf24] text-black"
                : "bg-[#1e1706] text-[#e8eaf0] hover:bg-[#2a2108]"
            }`}
          >
            Gradient
          </button>
        </div>
      </div>

      {colorMode === "solid" ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider">{solidLabel}</label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border border-[rgba(120,80,10,0.12)] bg-transparent p-0.5"
              title="Pick a color"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => {
                const val = e.target.value
                if (/^#[0-9a-fA-F]{0,6}$/.test(val)) onColorChange(val)
              }}
              className="px-3 py-2 rounded-lg bg-[#1e1706] border border-[rgba(120,80,10,0.12)] text-[#fff8e1]
                font-mono text-sm w-32 focus:outline-none focus:border-[#f59e0b] transition-all"
              maxLength={7}
            />
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => onColorChange(preset)}
                  title={preset}
                  className={`w-7 h-7 rounded-lg border-2 transition-all ${
                    color === preset ? "border-white scale-110" : "border-transparent hover:border-[rgba(255,255,255,0.3)]"
                  }`}
                  style={{ backgroundColor: preset }}
                />
              ))}
              <button
                onClick={() => {
                  const randomColor = `#${Math.floor(Math.random() * 16777215)
                    .toString(16)
                    .padStart(6, "0")}`
                  onColorChange(randomColor)
                }}
                title="Random Color"
                className="group relative w-7 h-7 rounded-lg border-2 border-transparent flex items-center justify-center
                  overflow-hidden transition-all duration-300 hover:border-yellow-400/50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-yellow-600/20 to-yellow-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="iconify w-4 h-4 text-yellow-400/70 group-hover:text-white transition-colors duration-300 z-10" data-icon="ion:sparkles-sharp" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider">Gradient Colors</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={gradientStart}
                onChange={(e) => onGradientStartChange(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-[rgba(120,80,10,0.12)] bg-transparent p-0.5"
                title="Gradient Start Color"
              />
              <input
                type="color"
                value={gradientEnd}
                onChange={(e) => onGradientEndChange(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-[rgba(120,80,10,0.12)] bg-transparent p-0.5"
                title="Gradient End Color"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider">
              Gradient Angle ({gradientAngle}deg)
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={gradientAngle}
              onChange={(e) => onGradientAngleChange(Number(e.target.value))}
              className="w-full h-2 bg-[#1e1706] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  )
}
