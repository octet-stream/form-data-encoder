import {Readable} from "stream"

import test from "ava"

import {FormData} from "formdata-node"

import readStream from "./__helper__/streamToString"
import readline from "./__helper__/readLine"

import {Encoder} from "./Encoder"

test("Has boundary string", t => {
  const encoder = new Encoder(new FormData())

  t.true(typeof encoder.boundary === "string")
})

test("Accepts custom boundary as the second argument", t => {
  const expected = "BoundaryString123"

  const encoder = new Encoder(new FormData(), expected)

  t.is(encoder.boundary, expected)
})

test("Has content-type string", t => {
  const encoder = new Encoder(new FormData())

  t.true(encoder.contentType.startsWith("multipart/form-data; boundary="))
})

test("Has content-type string with custom boundary string", t => {
  const expected = "BoundaryString123"

  const encoder = new Encoder(new FormData(), expected)

  t.is(encoder.contentType, `multipart/form-data; boundary=${expected}`)
})

test("Yields correct footer for empty FormData", async t => {
  const encoder = new Encoder(new FormData())

  const iterable = readline(Readable.from(encoder))

  const {value} = await iterable.next()

  t.is(value, `--${encoder.boundary}--`)
})

test("The footer ends with two crlf", async t => {
  const actual = await readStream(new Encoder(new FormData()))

  t.true(actual.endsWith("\r\n\r\n"))
})
