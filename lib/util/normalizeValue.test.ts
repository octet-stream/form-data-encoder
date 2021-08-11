import test from "ava"

import normalize from "./normalizeValue"

const expected = "First line.\r\nSecond line.\r\nThird line."

test("Replaces all CR not followed by LF with CRLF", t => {
  const actual = normalize("First line.\rSecond line.\rThird line.")

  t.is(actual, expected)
})

test("Replaces all LF not predicessed by CR with CRLF", t => {
  const actual = normalize("First line.\nSecond line.\nThird line.")

  t.is(actual, expected)
})

test("Keeps all CRLF without changes", t => {
  const actual = normalize(expected)

  t.is(actual, expected)
})
