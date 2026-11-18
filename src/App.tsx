import { AnimatePresence, motion } from "motion/react"
import { useMemo, useState } from "react"

import { CountryDrawer } from "@/components/game/country-drawer"
import { WorldGlobe } from "@/components/game/world-globe"
import { CountrySearch } from "@/components/game/country-search"
import { GlobeSettingsPopover } from "@/components/game/globe-settings-popover"
import { GuessList } from "@/components/game/guess-list"
import { RankingDialog } from "@/components/game/ranking-dialog"
import {
  RoundCelebration,
  type RoundOutcome,
} from "@/components/game/round-celebration"
import { RoundResult } from "@/components/game/round-result"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { COUNTRIES_BY_CODE } from "@/game/countries"
import { useGlobeSettings } from "@/game/globe-settings"
import type { Country } from "@/game/types"
import { useGame } from "@/game/use-game"

const swap = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18 },
}

export function App() {
  const { state, guess, next } = useGame()
  const { settings, update: updateSettings } = useGlobeSettings()
  const [focus, setFocus] = useState<Country | null>(null)
  const [selected, setSelected] = useState<Country | null>(null)

  const target = COUNTRIES_BY_CODE.get(state.target)
  const guessed = useMemo(
    () => new Set(state.guesses.map((g) => g.code)),
    [state.guesses]
  )
  const outcome = useMemo<RoundOutcome | null>(() => {
    const country = COUNTRIES_BY_CODE.get(state.target)
    if (state.status === "playing" || !country) return null
    return {
      id: `${state.target}-${state.stats.played}`,
      status: state.status,
      target: country,
      attempts: state.guesses.length,
      streak: state.streak,
    }
  }, [
    state.status,
    state.target,
    state.stats.played,
    state.guesses.length,
    state.streak,
  ])
  if (!target) return null

  const attemptsLeft = state.maxAttempts - state.guesses.length
  const roundOver = state.status !== "playing"
  const selectedDistance =
    state.guesses.find((g) => g.code === selected?.code)?.distanceKm ?? null

  const handleGuess = (code: string) => {
    guess(code)
    setFocus(COUNTRIES_BY_CODE.get(code) ?? null)
  }

  const openCountry = (country: Country) => {
    setFocus(country)
    setSelected(country)
  }

  const handleNext = () => {
    setSelected(null)
    next()
  }

  return (
    <div className="relative h-svh overflow-hidden">
      <WorldGlobe
        guesses={state.guesses}
        target={target}
        revealTarget={state.status === "lost"}
        focus={state.status === "lost" ? target : focus}
        settings={settings}
        onCountryClick={openCountry}
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <h1 className="text-lg font-semibold tracking-tight">GeoStreak</h1>
        <div className="pointer-events-auto flex items-center gap-2">
          <RankingDialog
            stats={state.stats}
            runs={state.runs}
            history={state.history}
            bestStreak={state.bestStreak}
            streak={state.streak}
            currentRun={state.currentRun}
          />
          <GlobeSettingsPopover settings={settings} onChange={updateSettings} />
        </div>
      </header>

      <main className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4">
        <Card className="pointer-events-auto w-full max-w-md">
          <CardHeader>
            <CardTitle>Which country is it?</CardTitle>
            <CardDescription>
              {roundOver
                ? "Round over · click a country for details"
                : `${attemptsLeft} of ${state.maxAttempts} attempts left · closer countries glow hotter`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <AnimatePresence mode="wait" initial={false}>
              {roundOver ? (
                <motion.div key={`result-${state.target}`} {...swap}>
                  <RoundResult
                    status={state.status === "won" ? "won" : "lost"}
                    target={target}
                    attempts={state.guesses.length}
                    onNext={handleNext}
                  />
                </motion.div>
              ) : (
                <motion.div key={`search-${state.target}`} {...swap}>
                  <CountrySearch
                    excluded={guessed}
                    disabled={roundOver}
                    onSelect={handleGuess}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="no-scrollbar max-h-48 scroll-fade-y overflow-y-auto">
              <GuessList
                guesses={state.guesses}
                targetCode={target.code}
                onSelect={openCountry}
              />
            </div>
          </CardContent>
        </Card>
      </main>

      <RoundCelebration outcome={outcome} />

      <CountryDrawer
        country={selected}
        distanceKm={selectedDistance}
        isTarget={selected?.code === target.code}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

export default App
