import { useCallback, useEffect, useReducer } from "react"

import { COUNTRIES_BY_CODE, PLAYABLE_COUNTRIES } from "./countries"
import {
  createGame,
  gameReducer,
  type GameAction,
  type GameState,
  type GameStats,
  type RoundRecord,
  type Run,
} from "./game"

const PROFILE_KEY = "geostreak:profile"

interface Profile {
  bestStreak: number
  streak?: number
  currentRun?: string[]
  stats: GameStats
  runs: Run[]
  history?: RoundRecord[]
}

function isProfile(value: unknown): value is Profile {
  return (
    typeof value === "object" &&
    value !== null &&
    "bestStreak" in value &&
    "stats" in value &&
    "runs" in value &&
    Array.isArray(value.runs)
  )
}

function readProfile(): Partial<Profile> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "")
    return isProfile(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function initGame() {
  return createGame({
    codes: PLAYABLE_COUNTRIES.map((c) => c.code),
    ...readProfile(),
  })
}

/** Container hook: owns the game state and exposes intent-level actions. */
export function useGame() {
  const [state, dispatch] = useReducer(
    (current: GameState, action: GameAction) => gameReducer(current, action),
    undefined,
    initGame
  )

  const { bestStreak, streak, currentRun, stats, runs, history } = state
  useEffect(() => {
    try {
      const profile: Profile = {
        bestStreak,
        streak,
        currentRun,
        stats,
        runs,
        history,
      }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    } catch {
      // Storage can be unavailable (private mode); the game still works in memory.
    }
  }, [bestStreak, streak, currentRun, stats, runs, history])

  const guess = useCallback(
    (code: string) =>
      dispatch({
        type: "guess",
        code,
        byCode: COUNTRIES_BY_CODE,
        now: Date.now(),
      }),
    []
  )
  const next = useCallback(() => dispatch({ type: "next" }), [])

  return { state, guess, next }
}
