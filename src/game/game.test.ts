import { describe, expect, it } from "vite-plus/test"

import { createDeck, createGame, gameReducer, type GameState } from "./game"
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
