import { useCallback, useEffect, useReducer } from "react"

import { COUNTRIES_BY_CODE, PLAYABLE_COUNTRIES } from "./countries"
import {
  createGame,
  gameReducer,
  type GameAction,
  type GameState,
} from "./game"

const BEST_STREAK_KEY = "geostreak:best-streak"

function readBestStreak() {
  try {
    return Number(localStorage.getItem(BEST_STREAK_KEY)) || 0
  } catch {
    return 0
  }
}

function initGame() {
  return createGame({
    codes: PLAYABLE_COUNTRIES.map((c) => c.code),
    bestStreak: readBestStreak(),
  })
}

/** Container hook: owns the game state and exposes intent-level actions. */
export function useGame() {
  const [state, dispatch] = useReducer(
    (current: GameState, action: GameAction) => gameReducer(current, action),
    undefined,
    initGame
  )

  useEffect(() => {
    try {
      localStorage.setItem(BEST_STREAK_KEY, String(state.bestStreak))
    } catch {
      // Storage can be unavailable (private mode); the streak still works in memory.
    }
  }, [state.bestStreak])

  const guess = useCallback(
    (code: string) =>
      dispatch({ type: "guess", code, byCode: COUNTRIES_BY_CODE }),
    []
  )
  const next = useCallback(() => dispatch({ type: "next" }), [])

  return { state, guess, next }
}
