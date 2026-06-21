"use client"

import { useRouter } from "next/navigation"
import TagSavedPanel from "@/components/dashboard/tag-saved-panel"
import type { TagConfiguration } from "@/lib/tag-config-types"
import { stashTagConfigForGenerator } from "@/lib/tag-config-storage"

export default function TagHistoryPage() {
  const router = useRouter()

  function handleLoadConfig(config: TagConfiguration) {
    stashTagConfigForGenerator(config)
    router.push("/dashboard")
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--app-text)]">History & Favourites</h1>
        <p className="mt-1 text-sm text-[var(--app-text-muted)]">
          Downloads are saved to history. Star tags you want to keep, then load them in the generator.
        </p>
      </div>
      <TagSavedPanel onLoadConfig={handleLoadConfig} fullPage />
    </div>
  )
}
