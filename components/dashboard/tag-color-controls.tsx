"use client"

import type { ColorMode } from "@/lib/tag-config-types"
import {
  MAX_GRADIENT_COLORS,
  MIN_GRADIENT_COLORS,
  normalizeGradientColors,
  randomGradientColors,
  randomHexColor,
} from "@/lib/gradient-utils"

const PRESET_COLORS = ["#e3e2a0", "#a1d59f", "#f7cfb1", "#DD3838", "#5E719E"]

interface TagColorControlsProps {
  colorMode: ColorMode
  color: string
  gradientColors: string[]
  gradientAngle: number
  onColorModeChange: (mode: ColorMode) => void
  onColorChange: (color: string) => void
  onGradientColorsChange: (colors: string[]) => void
  onGradientAngleChange: (angle: number) => void
  solidLabel?: string
}

function RandomColorButton({ onClick, title = "Random color" }: { onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="group relative w-7 h-7 rounded-lg border-2 border-transparent flex items-center justify-center
        overflow-hidden transition-all duration-300 hover:border-yellow-400/50 shrink-0"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-yellow-600/20 to-yellow-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <span className="iconify w-4 h-4 text-yellow-400/70 group-hover:text-white transition-colors duration-300 z-10" data-icon="ion:sparkles-sharp" />
    </button>
  )
}

export default function TagColorControls({
  colorMode,
  color,
  gradientColors,
  gradientAngle,
  onColorModeChange,
  onColorChange,
  onGradientColorsChange,
  onGradientAngleChange,
  solidLabel = "Background Tint Color",
}: TagColorControlsProps) {
  const stops = normalizeGradientColors(gradientColors)

  function updateStop(index: number, value: string) {
    const next = [...stops]
    next[index] = value
    onGradientColorsChange(next)
  }

  function addStop() {
    if (stops.length >= MAX_GRADIENT_COLORS) return
    onGradientColorsChange([...stops, randomHexColor()])
  }

  function removeStop(index: number) {
    if (stops.length <= MIN_GRADIENT_COLORS) return
    onGradientColorsChange(stops.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider">Color Mode</label>
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#1e1706] border border-[rgba(120,80,10,0.12)] w-fit">
          <button
            onClick={() => onColorModeChange("solid")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              colorMode === "solid"
                ? "bg-[#fbbf24] text-black shadow-sm"
                : "text-[#e8eaf0] hover:bg-[#2a2108]"
            }`}
          >
            Solid
          </button>
          <button
            onClick={() => onColorModeChange("gradient")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              colorMode === "gradient"
                ? "bg-[#fbbf24] text-black shadow-sm"
                : "text-[#e8eaf0] hover:bg-[#2a2108]"
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
              <RandomColorButton onClick={() => onColorChange(randomHexColor())} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-[#e8d8a8] uppercase tracking-wider">
                Gradient Colors ({stops.length}/{MAX_GRADIENT_COLORS})
              </label>
              <div className="flex items-center gap-2">
                <RandomColorButton
                  onClick={() => onGradientColorsChange(randomGradientColors())}
                  title="Randomize all gradient colors"
                />
                {stops.length < MAX_GRADIENT_COLORS && (
                  <button
                    onClick={addStop}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1e1706] text-[#fbbf24]
                      border border-[rgba(245,158,11,0.3)] hover:bg-[#2a2108] transition-all"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
              {stops.map((stopColor, index) => (
                <div key={index} className="flex items-center gap-2 rounded-lg bg-[#1e1706]/60 px-2 py-1.5">
                  <span className="text-[10px] text-[#7a869a] w-4 shrink-0">{index + 1}</span>
                  <input
                    type="color"
                    value={stopColor}
                    onChange={(e) => updateStop(index, e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-[rgba(120,80,10,0.12)] bg-transparent p-0.5 shrink-0"
                    title={`Gradient color ${index + 1}`}
                  />
                  <input
                    type="text"
                    value={stopColor}
                    onChange={(e) => {
                      const val = e.target.value
                      if (/^#[0-9a-fA-F]{0,6}$/.test(val)) updateStop(index, val)
                    }}
                    className="flex-1 min-w-0 px-2 py-1.5 rounded-lg bg-[#1e1706] border border-[rgba(120,80,10,0.12)] text-[#fff8e1]
                      font-mono text-xs focus:outline-none focus:border-[#f59e0b] transition-all"
                    maxLength={7}
                  />
                  <RandomColorButton
                    onClick={() => updateStop(index, randomHexColor())}
                    title={`Random color for stop ${index + 1}`}
                  />
                  {stops.length > MIN_GRADIENT_COLORS && (
                    <button
                      onClick={() => removeStop(index)}
                      title="Remove color"
                      className="p-1.5 rounded-lg text-[#7a869a] hover:text-red-400 hover:bg-[#1e1706] transition-all shrink-0"
                    >
                      <span className="iconify w-4 h-4" data-icon="mdi:close" />
                    </button>
                  )}
                </div>
              ))}
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
