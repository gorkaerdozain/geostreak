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
  /** Countries guessed in the current streak, in order. */
  currentRun: string[]
  stats: GameStats
  /** Best finished streaks, best first. */
  runs: Run[]
  /** Latest finished rounds, newest first. */
  history: RoundRecord[]
}

export interface RoundRecord {
  code: string
  won: boolean
  attempts: number
  endedAt: number
}

export const MAX_HISTORY = 20

export interface GameStats {
  played: number
  won: number
  /** Sum of attempts over won rounds, to compute the average. */
  winAttempts: number
}

export interface Run {
  streak: number
  countries: string[]
  endedAt: number
}

export const MAX_RUNS = 10

export type GameAction =
  | {
      type: "guess"
      code: string
      byCode: Map<string, Country>
      /** Timestamp used when a streak ends. */
      now?: number
    }
  | { type: "next" }

const EMPTY_STATS: GameStats = { played: 0, won: 0, winAttempts: 0 }

function addRun(runs: Run[], run: Run): Run[] {
  if (run.streak === 0) return runs
  return [...runs, run]
    .toSorted((a, b) => b.streak - a.streak || a.endedAt - b.endedAt)
    .slice(0, MAX_RUNS)
}

function addRound(history: RoundRecord[], round: RoundRecord) {
  return [round, ...history].slice(0, MAX_HISTORY)
}

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
  streak = 0,
  currentRun = [],
  stats = EMPTY_STATS,
  runs = [],
  history = [],
  random = Math.random,
}: {
  codes: string[]
  maxAttempts?: number
  bestStreak?: number
  streak?: number
  currentRun?: string[]
  stats?: GameStats
  runs?: Run[]
  history?: RoundRecord[]
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
    streak,
    bestStreak,
    currentRun,
    stats,
    runs,
    history,
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

      const round = {
        code: state.target,
        attempts: guesses.length,
        endedAt: action.now ?? 0,
      }

      if (action.code === state.target) {
        const streak = state.streak + 1
        return {
          ...state,
          guesses,
          status: "won",
          streak,
          bestStreak: Math.max(state.bestStreak, streak),
          currentRun: [...state.currentRun, state.target],
          stats: {
            played: state.stats.played + 1,
            won: state.stats.won + 1,
            winAttempts: state.stats.winAttempts + guesses.length,
          },
          history: addRound(state.history, { ...round, won: true }),
        }
      }

      if (guesses.length >= state.maxAttempts) {
        return {
          ...state,
          guesses,
          status: "lost",
          streak: 0,
          currentRun: [],
          stats: { ...state.stats, played: state.stats.played + 1 },
          runs: addRun(state.runs, {
            streak: state.streak,
            countries: state.currentRun,
            endedAt: action.now ?? 0,
          }),
          history: addRound(state.history, { ...round, won: false }),
        }
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
      const skipped = state.status === "playing"
      return {
        ...state,
        target,
        deck,
        guesses: [],
        status: "playing",
        streak: skipped ? 0 : state.streak,
        currentRun: skipped ? [] : state.currentRun,
      }
    }

    default:
      return state
  }
}
