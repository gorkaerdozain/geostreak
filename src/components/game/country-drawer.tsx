import {
  Analytics01Icon,
  Cancel01Icon,
  BookOpen01Icon,
  Building03Icon,
  Call02Icon,
  Globe02Icon,
  HeartCheckIcon,
  LanguageSkillIcon,
  Link01Icon,
  Maximize01Icon,
  Money01Icon,
  MountainIcon,
  SteeringIcon,
  Target02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { Suspense, use } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { distanceColor } from "@/game/color"
import { getCountryDetails } from "@/game/country-details"
import { COUNTRIES_BY_CODE } from "@/game/countries"
import type { Country } from "@/game/types"

const formatNumber = new Intl.NumberFormat("en", { maximumFractionDigits: 0 })
const formatCompact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
})
const formatUsd = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function Tile({
  icon,
  label,
  value,
}: {
  icon: IconSvgElement
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-background text-muted-foreground shadow-xs">
        <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="truncate text-sm font-medium">{value}</span>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

function DetailsSkeleton() {
  return (
    <>
      <Section title="About">
        <div className="flex flex-col gap-2 rounded-2xl bg-muted/60 p-4">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </Section>
      <Section title="Indicators">
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      </Section>
    </>
  )
}

function RemoteDetails({ code }: { code: string }) {
  const details = use(getCountryDetails(code))
  if (!details) {
    return (
      <p className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
        Extra details are unavailable right now.
      </p>
    )
  }

  const indicators = [
    details.hdi !== null && {
      icon: Analytics01Icon,
      label: "Human development",
      value: details.hdi.toFixed(3),
    },
    details.gdpPerCapita !== null && {
      icon: Money01Icon,
      label: "GDP per capita",
      value: formatUsd.format(details.gdpPerCapita),
    },
    details.lifeExpectancy !== null && {
      icon: HeartCheckIcon,
      label: "Life expectancy",
      value: `${details.lifeExpectancy.toFixed(1)} years`,
    },
    details.highestPoint !== null && {
      icon: MountainIcon,
      label: "Highest point",
      value: details.highestPoint,
    },
    details.callingCode !== null && {
      icon: Call02Icon,
      label: "Calling code",
      value: details.callingCode,
    },
    details.drivingSide !== null && {
      icon: SteeringIcon,
      label: "Drives on the",
      value: details.drivingSide,
    },
  ].filter((item) => item !== false)

  return (
    <>
      {details.extract && (
        <Section title="About">
          <div className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-4">
            {details.description && (
              <p className="text-sm font-medium first-letter:uppercase">
                {details.description}
              </p>
            )}
            <p className="line-clamp-5 text-sm text-muted-foreground">
              {details.extract}
            </p>
            {details.wikipediaUrl && (
              <a
                href={details.wikipediaUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
              >
                <HugeiconsIcon
                  icon={BookOpen01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                Read on Wikipedia
              </a>
            )}
          </div>
        </Section>
      )}
      {indicators.length > 0 && (
        <Section title="Indicators">
          <div className="grid grid-cols-2 gap-2">
            {indicators.map((item) => (
              <Tile key={item.label} {...item} />
            ))}
          </div>
        </Section>
      )}
      {details.website && (
        <a
          href={details.website}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className="size-4" />
          {new URL(details.website).hostname}
        </a>
      )}
    </>
  )
}

export function CountryDrawer({
  country,
  distanceKm,
  isTarget,
  onClose,
}: {
  country: Country | null
  distanceKm: number | null
  isTarget: boolean
  onClose: () => void
}) {
  const neighbours = (country?.borders ?? [])
    .map((code) => COUNTRIES_BY_CODE.get(code))
    .filter((c) => c !== undefined)

  return (
    <Drawer
      open={country !== null}
      onOpenChange={(open) => !open && onClose()}
      swipeDirection="right"
    >
      <DrawerContent className="sm:max-w-md">
        {country && (
          <>
            <DrawerHeader className="flex-row items-center gap-4 p-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-muted text-4xl">
                {country.flag}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <DrawerTitle className="truncate text-xl">
                  {country.name}
                </DrawerTitle>
                <DrawerDescription>
                  {country.nameEs} · {country.subregion}
                </DrawerDescription>
              </div>
              <DrawerClose
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="self-start"
                    aria-label="Close"
                  />
                }
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              </DrawerClose>
            </DrawerHeader>

            <div className="no-scrollbar flex min-h-0 flex-1 scroll-fade-y flex-col gap-5 overflow-y-auto p-4 pb-6">
              {distanceKm !== null && (
                <div className="flex items-center gap-3 rounded-2xl border p-3">
                  <span
                    aria-hidden
                    className="size-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor: distanceColor(distanceKm, isTarget),
                    }}
                  />
                  <HugeiconsIcon
                    icon={Target02Icon}
                    strokeWidth={2}
                    className="size-4 text-muted-foreground"
                  />
                  <span className="text-sm">
                    {isTarget
                      ? "This was the country 🎯"
                      : distanceKm === 0
                        ? "Touching the target country"
                        : `${formatNumber.format(distanceKm)} km from the target`}
                  </span>
                </div>
              )}

              <Section title="At a glance">
                <div className="grid grid-cols-2 gap-2">
                  <Tile
                    icon={Building03Icon}
                    label="Capital"
                    value={country.capital ?? "—"}
                  />
                  <Tile
                    icon={Globe02Icon}
                    label="Continent"
                    value={country.continent}
                  />
                  <Tile
                    icon={UserGroupIcon}
                    label="Population"
                    value={formatCompact.format(country.population)}
                  />
                  <Tile
                    icon={Maximize01Icon}
                    label="Area"
                    value={`${formatNumber.format(country.area)} km²`}
                  />
                </div>
              </Section>

              <Suspense fallback={<DetailsSkeleton />}>
                <RemoteDetails code={country.code} />
              </Suspense>

              <Section title="Languages & currencies">
                <div className="flex flex-wrap gap-1.5">
                  {country.languages.map((language) => (
                    <Badge key={language} variant="secondary">
                      <HugeiconsIcon
                        icon={LanguageSkillIcon}
                        strokeWidth={2}
                        data-icon="inline-start"
                      />
                      {language}
                    </Badge>
                  ))}
                  {country.currencies.map((currency) => (
                    <Badge key={currency} variant="outline">
                      <HugeiconsIcon
                        icon={Money01Icon}
                        strokeWidth={2}
                        data-icon="inline-start"
                      />
                      {currency}
                    </Badge>
                  ))}
                </div>
              </Section>

              {neighbours.length > 0 && (
                <Section title={`Neighbours · ${neighbours.length}`}>
                  <div className="flex flex-wrap gap-1.5">
                    {neighbours.map((n) => (
                      <Badge key={n.code} variant="outline">
                        {n.flag} {n.name}
                      </Badge>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
