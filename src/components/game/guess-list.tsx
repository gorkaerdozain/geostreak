import { AnimatePresence, motion } from "motion/react"

import { distanceColor } from "@/game/color"
import { COUNTRIES_BY_CODE } from "@/game/countries"
import type { Guess } from "@/game/game"
import type { Country } from "@/game/types"

const formatKm = new Intl.NumberFormat("en", { maximumFractionDigits: 0 })

export function GuessList({
  guesses,
  targetCode,
  onSelect,
}: {
  guesses: Guess[]
  targetCode: string
  onSelect: (country: Country) => void
}) {
  const sorted = guesses.toSorted((a, b) => a.distanceKm - b.distanceKm)

  return (
    <ul className="relative flex flex-col gap-1">
      <AnimatePresence initial={false}>
        {sorted.map((guess) => {
          const country = COUNTRIES_BY_CODE.get(guess.code)
          if (!country) return null
          const isTarget = guess.code === targetCode
          return (
            <motion.li
              key={guess.code}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", bounce: 0.25, duration: 0.45 }}
            >
              <button
                type="button"
                onClick={() => onSelect(country)}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: distanceColor(guess.distanceKm, isTarget),
                  }}
                />
                <span className="text-base leading-none">{country.flag}</span>
                <span className="truncate">{country.name}</span>
                <span className="ml-auto text-muted-foreground tabular-nums">
                  {isTarget ? "🎯" : `${formatKm.format(guess.distanceKm)} km`}
                </span>
              </button>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}
