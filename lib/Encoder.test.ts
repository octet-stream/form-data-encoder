import {Readable} from "stream"
import {promises as fs} from "fs"

import test from "ava"

import {FormData, File, fileFromPath} from "formdata-node"

import readStream from "./__helper__/readStream"
import skip from "./__helper__/skipIterations"
import readLine from "./__helper__/readLine"

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

test("Has correct headers", async t => {
  const encoder = new Encoder(new FormData())

  t.deepEqual(encoder.headers, {
    "Content-Type": `multipart/form-data; boundary=${encoder.boundary}`,
    "Content-Length": await readStream(encoder).then(({length}) => length)
  })
})

test("Yields correct footer for empty FormData", async t => {
  const encoder = new Encoder(new FormData())

  const iterable = readLine(Readable.from(encoder))

  const {value} = await skip(iterable)

  t.is(value, `--${encoder.boundary}--`)
})

test("The footer ends with two crlf", async t => {
  const actual = await readStream(new Encoder(new FormData()), true)

  t.true(actual.endsWith("\r\n\r\n"))
})

test("Returns correct length of the empty FormData content", async t => {
  const encoder = new Encoder(new FormData())
  const expected = await readStream(encoder).then(({length}) => length)

  t.is<number>(encoder.getContentLength(), expected)
})

test("Returns the length of the FormData content", async t => {
  const fd = new FormData()

  fd.set("field", "Some string")
  fd.set("file", new File(["Some content"], "file.txt"))

  const encoder = new Encoder(fd)

  const expected = await readStream(encoder).then(({length}) => length)

  t.is<number>(encoder.getContentLength(), expected)
})

test("Yields correct headers for a field", async t => {
  const fd = new FormData()

  fd.set("field", "Some value")

  const iterable = readLine(Readable.from(new Encoder(fd)))

  const {value} = await skip(iterable, 2)

  t.is(value, "Content-Disposition: form-data; name=\"field\"")
})

test("Yields field's content", async t => {
  const expected = "Some value"

  const fd = new FormData()

  fd.set("field", expected)

  const {value} = await skip(readLine(Readable.from(new Encoder(fd))), 4)

  t.is(value, expected)
})

test("Yields Content-Disposition header for a File", async t => {
  const fd = new FormData()

  fd.set("file", new File(["My hovercraft is full of eels"], "file.txt"))

  const {value} = await skip(readLine(Readable.from(new Encoder(fd))), 2)

  t.is(
    value,
    "Content-Disposition: form-data; name=\"file\"; filename=\"file.txt\""
  )
})

test("Yields Content-Type header for a File", async t => {
  const fd = new FormData()

  fd.set("file", new File(["My hovercraft is full of eels"], "file.txt"))

  const {value} = await skip(readLine(Readable.from(new Encoder(fd))), 3)

  t.is(value, "Content-Type: text/plain")
})

test(
  "File has default Content-Type set to application/octet-stream",
  async t => {
    const fd = new FormData()

    fd.set("file", new File(["Some content"], "file"))

    const iterable = readLine(Readable.from(new Encoder(fd)))

    const {value} = await skip(iterable, 3)

    t.is(value, "Content-Type: application/octet-stream")
  }
)

test("Yields File's content", async t => {
  const filePath = "license"
  const fd = new FormData()

  const expected = await fs.readFile(filePath, "utf-8")

  fd.set("license", await fileFromPath(filePath))

  const encoder = new Encoder(fd)
  const iterable = readLine(Readable.from(encoder))

  await skip(iterable, 4)

  const footer = `--${encoder.boundary}--`;
  let chunks: string[] = []

  for await (const chunk of iterable) {
    if (chunk !== footer) {
      chunks.push(chunk)
    }
  }

  chunks.pop() // Remove trailing empty line

  t.is<string>(chunks.join("\n"), expected)
})

test(
  "Throws TypeError when the first argument is not a FormData instance",
  t => {
    const trap = () => new Encoder({} as any)

    t.throws(trap, {
      instanceOf: TypeError,
      message: "Expected first argument to be a FormData instance."
    })
  }
)

test("Throws TypeError when given boundary is not a string", t => {
  const trap = () => new Encoder(new FormData(), 42 as any)

  t.throws(trap, {
    instanceOf: TypeError,
    message: "Expected boundary to be a string."
  })
})
