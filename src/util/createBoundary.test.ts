import test from "ava"

import {createBoundary} from "./createBoundary.js"

test("Returns a string", t => {
  const actual = createBoundary()

  t.is(typeof actual, "string")
})

test("Returns a string that passes regex of valid range", t => {
  const actual = createBoundary()

  t.regex(actual, /^[a-zA-Z0-9'_-]+$/)
})
