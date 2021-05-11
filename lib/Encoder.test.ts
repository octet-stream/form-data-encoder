import {Readable} from "stream"

import test from "ava"

import {FormData, File} from "formdata-node"

import readStream from "./__helper__/readStream"
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
  const actual = await readStream(new Encoder(new FormData()), true)

  t.true(actual.endsWith("\r\n\r\n"))
})

test("Returns correct length of the FormData content", async t => {
  const encoder = new Encoder(new FormData())
  const expected = await readStream(encoder).then(({length}) => length)

  t.is<number>(encoder.getContentLength(), expected)
})

test("Yields correct headers for a field", async t => {
  const fd = new FormData()

  fd.set("field", "Some value")

  const iterable = readline(Readable.from(new Encoder(fd)))

  await iterable.next()

  const {value} = await iterable.next()

  t.is(value, "Content-Disposition: form-data; name=\"field\"")
})

test("Yields correct headers for a file", async t => {
  const fd = new FormData()

  fd.set("file", new File(["My hovercraft is full of eels"], "file.txt"))

  const iterable = readline(Readable.from(new Encoder(fd)))

  await iterable.next()

  const {value: fileDispositionAndName} = await iterable.next()
  const {value: fileContntType} = await iterable.next()

  t.is(
    fileDispositionAndName,
    "Content-Disposition: form-data; name=\"file\"; filename=\"file.txt\""
  )

  t.is(fileContntType, "Content-Type: text/plain")
})

test("Throws TypeError when the first argument is not a FormData instance", t => {
  const trap = () => new Encoder({} as any)

  t.throws(trap, {
    instanceOf: TypeError,
    message: "Expected first argument to be a FormData instance."
  })
})

test("Throws TypeError when given boundary is not a string", t => {
  const trap = () => new Encoder(new FormData(), 42 as any)

  t.throws(trap, {
    instanceOf: TypeError,
    message: "Expected boundary to be a string."
  })
})
