import {promises as fs} from "fs"
import {Readable} from "stream"

import test from "ava"

import {ReadableStream} from "web-streams-polyfill/ponyfill/es2018"
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

  const footer = `--${encoder.boundary}--`
  const chunks: string[] = []

  for await (const chunk of iterable) {
    if (chunk !== footer) {
      chunks.push(chunk)
    }
  }

  chunks.pop() // Remove trailing empty line

  t.is<string>(chunks.join("\n"), expected)
})

test("Yields every appended file", async t => {
  const expectedDisposition = "Content-Disposition: form-data; name=\"field\""

  const fd = new FormData()

  fd.append("field", "Some string")
  fd.append("field", "Some other string")

  const iterable = readLine(Readable.from(new Encoder(fd)))

  const {value: firstFieldDisposition} = await skip(iterable, 2)

  t.is(firstFieldDisposition, expectedDisposition)

  const {value: firstFieldContent} = await skip(iterable, 2)

  t.is(firstFieldContent, "Some string")

  const {value: secondFieldDisposition} = await skip(iterable, 2)

  t.is(secondFieldDisposition, expectedDisposition)

  const {value: secondFieldContent} = await skip(iterable, 2)

  t.is(secondFieldContent, "Some other string")
})

test("Yields every appended File", async t => {
  const expectedDisposition = "Content-Disposition: form-data; name=\"file\""

  const fd = new FormData()

  fd.append("file", new File(["Some content"], "file.txt"))
  fd.append("file", new File(["Some **content**"], "file.md"))

  const iterable = readLine(Readable.from(new Encoder(fd)))

  const {value: firstFileDisposition} = await skip(iterable, 2)

  t.is(firstFileDisposition, `${expectedDisposition}; filename="file.txt"`)

  const {value: firstFileType} = await skip(iterable)

  t.is(firstFileType, "Content-Type: text/plain")

  const {value: firstFileContent} = await skip(iterable, 2)

  t.is(firstFileContent, "Some content")

  const {value: secondFileDisposition} = await skip(iterable, 2)

  t.is(secondFileDisposition, `${expectedDisposition}; filename="file.md"`)

  const {value: secondFileType} = await skip(iterable)

  t.is(secondFileType, "Content-Type: text/markdown")

  const {value: secondFileContent} = await skip(iterable, 2)

  t.is(secondFileContent, "Some **content**")
})

test("Can be used with ReadableStream", async t => {
  const fd = new FormData()

  fd.set("field", "Some field value")

  const encoder = new Encoder(fd)
  const iterable = encoder.encode()

  const readable = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const {value, done} = await iterable.next()

      if (done) {
        return controller.close()
      }

      controller.enqueue(value as Uint8Array)
    }
  })

  const expected = await readStream(encoder)
  const actual = await readStream(readable)

  t.true(actual.equals(expected))
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
