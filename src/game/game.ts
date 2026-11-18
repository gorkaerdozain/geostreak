import { borderDistanceKm } from "./distance"
import type { Country } from "./types"

export type Random = () => number

export interface Guess {
  code: string
  distanceKm: number
}

export interface GameState {
  codes: string[]
  deck: string[]
  target: string
  guesses: Guess[]
  maxAttempts: number
  status: "playing" | "won" | "lost"
  streak: number
  bestStreak: number
}

export type GameAction =
  | { type: "guess"; code: string; byCode: Map<string, Country> }
  | { type: "next" }

/** Fisher–Yates shuffle that returns a new array. */
export function createDeck(codes: string[], random: Random): string[] {
  const deck = [...codes]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

/** Takes the next target, reshuffling when the deck runs out. */
function drawTarget(
  codes: string[],
  deck: string[],
  previous: string | null,
  random: Random
) {
  let remaining = deck.length > 0 ? deck : createDeck(codes, random)
  if (remaining[0] === previous && remaining.length > 1) {
    remaining = [remaining[1], remaining[0], ...remaining.slice(2)]
  }
  const [target, ...rest] = remaining
  return { target, deck: rest }
}

export function createGame({
  codes,
  maxAttempts = 10,
  bestStreak = 0,
  random = Math.random,
}: {
  codes: string[]
  maxAttempts?: number
  bestStreak?: number
  random?: Random
}): GameState {
  const { target, deck } = drawTarget(codes, [], null, random)
  return {
    codes,
    deck,
    target,
    guesses: [],
    maxAttempts,
    status: "playing",
    streak: 0,
    bestStreak,
  }
}

export function gameReducer(
  state: GameState,
  action: GameAction,
  random: Random = Math.random
): GameState {
  switch (action.type) {
    case "guess": {
      if (state.status !== "playing") return state
      if (state.guesses.some((g) => g.code === action.code)) return state

      const target = action.byCode.get(state.target)
      const guessed = action.byCode.get(action.code)
      if (!target || !guessed) return state

      const guesses = [
        ...state.guesses,
        { code: action.code, distanceKm: borderDistanceKm(guessed, target) },
      ]

      if (action.code === state.target) {
        const streak = state.streak + 1
        return {
          ...state,
          guesses,
          status: "won",
          streak,
          bestStreak: Math.max(state.bestStreak, streak),
        }
      }

      if (guesses.length >= state.maxAttempts) {
        return { ...state, guesses, status: "lost", streak: 0 }
      }

      return { ...state, guesses }
    }

    case "next": {
      const { target, deck } = drawTarget(
        state.codes,
        state.deck,
        state.target,
        random
      )
      const streak = state.status === "playing" ? 0 : state.streak
      return { ...state, target, deck, guesses: [], status: "playing", streak }
    }

    default:
      return state
  }
}
