import test from "ava"

import createBoundary from "./createBoundary"

test("Returns a string", t => {
  const actual = createBoundary(16)

  t.is(typeof actual, "string")
})

test("Returns a string of given length", t => {
  const expected = 24
  const actual = createBoundary(expected)

  t.is(actual.length, expected)
})

test("Returns a string that passes regex of valid range", t => {
  const actual = createBoundary(16)

  t.regex(actual, /^[a-zA-Z0-9'_-]+$/)
})
