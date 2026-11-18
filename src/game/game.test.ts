import { describe, expect, it } from "vite-plus/test"

import {
  MAX_HISTORY,
  createDeck,
  createGame,
  gameReducer,
  type GameState,
} from "./game"
import { makeCountry } from "./test-fixtures"

const countries = [
  makeCountry("AAA", [0, 0]),
  makeCountry("BBB", [10, 0]),
  makeCountry("CCC", [20, 0]),
  makeCountry("DDD", [30, 0]),
]
const codes = countries.map((c) => c.code)
const byCode = new Map(countries.map((c) => [c.code, c]))
const noShuffle = () => 0.999999

function start(maxAttempts = 3): GameState {
  return createGame({ codes, maxAttempts, random: noShuffle })
}

describe("createDeck", () => {
  it("contains every country exactly once", () => {
    const deck = createDeck(codes, Math.random)
    expect(deck.toSorted()).toEqual(codes.toSorted())
  })
})

describe("endless mode", () => {
  it("does not repeat a country until every country has been played", () => {
    let state = start()
    const seen = [state.target]
    for (let i = 0; i < codes.length - 1; i++) {
      state = gameReducer(
        state,
        { type: "guess", code: state.target, byCode },
        noShuffle
      )
      state = gameReducer(state, { type: "next" }, noShuffle)
      seen.push(state.target)
    }
    expect(new Set(seen).size).toBe(codes.length)
  })

  it("reshuffles when the deck runs out and keeps playing", () => {
    let state = start()
    for (let i = 0; i < codes.length * 2; i++) {
      state = gameReducer(state, { type: "next" }, noShuffle)
      expect(codes).toContain(state.target)
    }
  })

  it("never serves the same country twice in a row across a reshuffle", () => {
    let state = start()
    let previous = state.target
    for (let i = 0; i < codes.length * 3; i++) {
      state = gameReducer(state, { type: "next" }, noShuffle)
      expect(state.target).not.toBe(previous)
      previous = state.target
    }
  })
})

describe("guessing", () => {
  it("records a wrong guess with its border distance", () => {
    const state = start()
    const wrong = codes.find((c) => c !== state.target)!
    const next = gameReducer(state, { type: "guess", code: wrong, byCode })
    expect(next.guesses).toHaveLength(1)
    expect(next.guesses[0].code).toBe(wrong)
    expect(next.guesses[0].distanceKm).toBeGreaterThan(0)
    expect(next.status).toBe("playing")
  })

  it("ignores a country that was already guessed", () => {
    const state = start()
    const wrong = codes.find((c) => c !== state.target)!
    const once = gameReducer(state, { type: "guess", code: wrong, byCode })
    const twice = gameReducer(once, { type: "guess", code: wrong, byCode })
    expect(twice).toBe(once)
  })

  it("wins and increases the streak when the target is guessed", () => {
    const state = start()
    const next = gameReducer(state, {
      type: "guess",
      code: state.target,
      byCode,
    })
    expect(next.status).toBe("won")
    expect(next.streak).toBe(1)
    expect(next.bestStreak).toBe(1)
  })

  it("loses after the attempt cap and resets the streak", () => {
    let state = { ...start(2), streak: 4, bestStreak: 4 }
    const wrong = codes.filter((c) => c !== state.target)
    state = gameReducer(state, { type: "guess", code: wrong[0], byCode })
    state = gameReducer(state, { type: "guess", code: wrong[1], byCode })
    expect(state.status).toBe("lost")
    expect(state.streak).toBe(0)
    expect(state.bestStreak).toBe(4)
  })

  it("ignores guesses once the round is over", () => {
    const won = gameReducer(start(), {
      type: "guess",
      code: start().target,
      byCode,
    })
    const other = codes.find((c) => c !== won.target)!
    expect(gameReducer(won, { type: "guess", code: other, byCode })).toBe(won)
  })

  it("clears guesses and keeps the streak on next", () => {
    const won = gameReducer(start(), {
      type: "guess",
      code: start().target,
      byCode,
    })
    const next = gameReducer(won, { type: "next" })
    expect(next.status).toBe("playing")
    expect(next.guesses).toEqual([])
    expect(next.streak).toBe(1)
  })
})

const win = (state: GameState, now = 1) =>
  gameReducer(state, { type: "guess", code: state.target, byCode, now })

function loseRound(state: GameState, now = 2) {
  let next = state
  for (const code of codes.filter((c) => c !== state.target)) {
    next = gameReducer(next, { type: "guess", code, byCode, now })
  }
  return next
}

describe("ranking stats", () => {
  it("counts played and won rounds with the attempts of each win", () => {
    let state = win(start())
    state = gameReducer(state, { type: "next" }, noShuffle)
    state = loseRound(state)
    expect(state.stats).toEqual({ played: 2, won: 1, winAttempts: 1 })
  })

  it("records the run with its countries when a streak ends", () => {
    let state = win(start())
    const first = state.target
    state = gameReducer(state, { type: "next" }, noShuffle)
    state = win(state)
    const second = state.target
    state = gameReducer(state, { type: "next" }, noShuffle)
    state = loseRound(state, 42)
    expect(state.runs).toEqual([
      { streak: 2, countries: [first, second], endedAt: 42 },
    ])
  })

  it("does not record empty runs", () => {
    const state = loseRound(start())
    expect(state.runs).toEqual([])
  })

  it("keeps only the top runs, best first", () => {
    let state: GameState = {
      ...start(),
      runs: Array.from({ length: 10 }, (_, i) => ({
        streak: i + 1,
        countries: [],
        endedAt: i,
      })).toReversed(),
    }
    state = win(state)
    state = gameReducer(state, { type: "next" }, noShuffle)
    state = win(state)
    state = gameReducer(state, { type: "next" }, noShuffle)
    state = loseRound(state)
    expect(state.runs.map((r) => r.streak)).toEqual([
      10, 9, 8, 7, 6, 5, 4, 3, 2, 2,
    ])
  })
})

describe("round history", () => {
  it("records every finished round, newest first", () => {
    let state = win(start(), 10)
    const first = state.target
    state = gameReducer(state, { type: "next" }, noShuffle)
    const second = state.target
    state = loseRound(state, 20)
    expect(state.history).toEqual([
      { code: second, won: false, attempts: 3, endedAt: 20 },
      { code: first, won: true, attempts: 1, endedAt: 10 },
    ])
  })

  it("keeps only the latest rounds", () => {
    let state = start()
    for (let i = 0; i < MAX_HISTORY + 5; i++) {
      state = gameReducer(win(state, i), { type: "next" }, noShuffle)
    }
    expect(state.history).toHaveLength(MAX_HISTORY)
    expect(state.history[0].endedAt).toBe(MAX_HISTORY + 4)
  })
})

describe("restoring a profile", () => {
  it("resumes an in-progress streak with its countries", () => {
    const state = createGame({
      codes,
      streak: 2,
      currentRun: ["AAA", "BBB"],
      random: noShuffle,
    })
    expect(state.streak).toBe(2)
    expect(state.currentRun).toEqual(["AAA", "BBB"])
  })

  it("restores the round history", () => {
    const history = [{ code: "AAA", won: true, attempts: 2, endedAt: 5 }]
    expect(createGame({ codes, history, random: noShuffle }).history).toEqual(
      history
    )
  })
})
