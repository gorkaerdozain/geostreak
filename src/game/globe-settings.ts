import { useEffect, useState } from "react"

export interface GlobeSettings {
  autoRotate: boolean
  /** Keep distance labels on screen, or only show the hovered one. */
  alwaysShowLabels: boolean
}

const SETTINGS_KEY = "geostreak:globe"
const DEFAULT_SETTINGS: GlobeSettings = {
  autoRotate: true,
  alwaysShowLabels: true,
}

function readBoolean(source: object, key: keyof GlobeSettings) {
  const value: unknown = Reflect.get(source, key)
  return typeof value === "boolean" ? value : DEFAULT_SETTINGS[key]
}

function readSettings(): GlobeSettings {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "")
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_SETTINGS
    return {
      autoRotate: readBoolean(parsed, "autoRotate"),
      alwaysShowLabels: readBoolean(parsed, "alwaysShowLabels"),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function useGlobeSettings() {
  const [settings, setSettings] = useState(readSettings)

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch {
      // Not persisted when storage is unavailable.
    }
  }, [settings])

  const update = (patch: Partial<GlobeSettings>) =>
    setSettings((current) => ({ ...current, ...patch }))

  return { settings, update }
}
