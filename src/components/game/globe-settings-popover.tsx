import { Settings02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { GlobeSettings } from "@/game/globe-settings"

const THEMES = { light: "Light", dark: "Dark", system: "System" } as const
const isThemeValue = (value: unknown): value is keyof typeof THEMES =>
  typeof value === "string" && value in THEMES

export function GlobeSettingsPopover({
  settings,
  onChange,
}: {
  settings: GlobeSettings
  onChange: (patch: Partial<GlobeSettings>) => void
}) {
  const { theme, setTheme } = useTheme()
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="secondary" size="icon" aria-label="Settings" />
        }
      >
        <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Settings</PopoverTitle>
          <PopoverDescription>
            How the world looks while you play.
          </PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Theme</Label>
            <ToggleGroup
              variant="outline"
              size="sm"
              value={[theme]}
              onValueChange={(values) => {
                const [value] = values
                if (isThemeValue(value)) setTheme(value)
              }}
            >
              {Object.entries(THEMES).map(([value, label]) => (
                <ToggleGroupItem key={value} value={value}>
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="globe-labels">Always show distances</Label>
            <Switch
              id="globe-labels"
              checked={settings.alwaysShowLabels}
              onCheckedChange={(alwaysShowLabels) =>
                onChange({ alwaysShowLabels })
              }
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="globe-rotate">Auto-rotate</Label>
            <Switch
              id="globe-rotate"
              checked={settings.autoRotate}
              onCheckedChange={(autoRotate) => onChange({ autoRotate })}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
