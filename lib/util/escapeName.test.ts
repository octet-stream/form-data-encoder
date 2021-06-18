import test from "ava"

import escapeName from "./escapeName"

const CR = "%0D"
const LF = "%0A"
const Q = "%22"

test("Escapes all the CRs in the name", t => {
  t.is<string>(escapeName("\rna\rme\r"), `${CR}na${CR}me${CR}`)
})

test("Keeps escaped CR as is", t => {
  const expected = `name${CR}`

  t.is<string>(escapeName(expected), expected)
})

test("Escapes all the LFs in the name", t => {
  t.is<string>(escapeName("nam\ne\n"), `nam${LF}e${LF}`)
})

test("Keeps escaped LF as is", t => {
  const expected = `name${LF}`

  t.is<string>(escapeName(expected), expected)
})

test("Escapes all double quotes in the name", t => {
  t.is<string>(escapeName("\"name\""), `${Q}name${Q}`)
})
