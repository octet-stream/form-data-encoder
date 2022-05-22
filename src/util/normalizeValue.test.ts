import test from "ava"

import {normalizeValue} from "./normalizeValue.js"

const expected = "\r\nFirst line.\r\nSecond line.\r\nThird line.\r\n"

test("Replaces all CR not followed by LF with CRLF", t => {
  const actual = normalizeValue("\rFirst line.\rSecond line.\rThird line.\r")

  t.is(actual, expected)
})

test("Replaces all LF not predicessed by CR with CRLF", t => {
  const actual = normalizeValue("\nFirst line.\nSecond line.\nThird line.\n")

  t.is(actual, expected)
})

test("Replaces all CR or LF characters in a string", t => {
  const actual = normalizeValue("\rFirst line.\nSecond line.\rThird line.\n")

  t.is(actual, expected)
})

test("Keeps all CRLF without changes", t => {
  const actual = normalizeValue(expected)

  t.is(actual, expected)
})
