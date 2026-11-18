import { useMemo, useState } from "react"

import { CountrySearch } from "@/components/game/country-search"
import { GuessList } from "@/components/game/guess-list"
import { RoundResult } from "@/components/game/round-result"
import { WorldGlobe } from "@/components/game/world-globe"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { COUNTRIES_BY_CODE } from "@/game/countries"
import type { GlobeSettings } from "@/game/globe-settings"
import type { Country } from "@/game/types"
import { useGame } from "@/game/use-game"

const GLOBE_SETTINGS: GlobeSettings = {
  autoRotate: true,
  alwaysShowLabels: true,
}

export function App() {
  const { state, guess, next } = useGame()
  const [focus, setFocus] = useState<Country | null>(null)

  const target = COUNTRIES_BY_CODE.get(state.target)
  const guessed = useMemo(
    () => new Set(state.guesses.map((g) => g.code)),
    [state.guesses]
  )
  if (!target) return null

  const attemptsLeft = state.maxAttempts - state.guesses.length
  const roundOver = state.status !== "playing"

  const handleGuess = (code: string) => {
    guess(code)
    setFocus(COUNTRIES_BY_CODE.get(code) ?? null)
  }

  return (
    <div className="relative h-svh overflow-hidden">
      <WorldGlobe
        guesses={state.guesses}
        target={target}
        revealTarget={state.status === "lost"}
        focus={state.status === "lost" ? target : focus}
        settings={GLOBE_SETTINGS}
        onCountryClick={setFocus}
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <h1 className="text-lg font-semibold tracking-tight">GeoStreak</h1>
        <p className="text-sm font-medium tabular-nums">
          🔥 {state.streak} · 🏆 {state.bestStreak}
        </p>
      </header>

      <main className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4">
        <Card className="pointer-events-auto w-full max-w-md">
          <CardHeader>
            <CardTitle>Which country is it?</CardTitle>
            <CardDescription>
              {roundOver
                ? "Round over"
                : `${attemptsLeft} of ${state.maxAttempts} attempts left · closer countries glow hotter`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {roundOver ? (
              <RoundResult
                status={state.status === "won" ? "won" : "lost"}
                target={target}
                attempts={state.guesses.length}
                onNext={next}
              />
            ) : (
              <CountrySearch
                excluded={guessed}
                disabled={roundOver}
                onSelect={handleGuess}
              />
            )}
            <div className="no-scrollbar max-h-48 scroll-fade-y overflow-y-auto">
              <GuessList
                guesses={state.guesses}
                targetCode={target.code}
                onSelect={setFocus}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default App
