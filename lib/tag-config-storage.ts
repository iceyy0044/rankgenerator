import type { TagConfiguration } from "@/lib/tag-config-types"

export const LOAD_TAG_CONFIG_KEY = "rank-tag-load-config"

export function stashTagConfigForGenerator(config: TagConfiguration) {
  sessionStorage.setItem(LOAD_TAG_CONFIG_KEY, JSON.stringify(config))
}

export function consumeStashedTagConfig(): TagConfiguration | null {
  const raw = sessionStorage.getItem(LOAD_TAG_CONFIG_KEY)
  if (!raw) return null
  sessionStorage.removeItem(LOAD_TAG_CONFIG_KEY)
  try {
    return JSON.parse(raw) as TagConfiguration
  } catch {
    return null
  }
}
