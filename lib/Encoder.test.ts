import {promises as fs} from "fs"
import {Readable} from "stream"

import test from "ava"

import {FormData, Blob, File, fileFromPath} from "formdata-node"

import skipSync from "./__helper__/skipIterationsSync"
import readStream from "./__helper__/readStream"
import skip from "./__helper__/skipIterations"
import readLine from "./__helper__/readLine"

import {FormDataEncoder} from "./Encoder"

test("Has boundary string", t => {
  const encoder = new FormDataEncoder(new FormData())

  t.true(typeof encoder.boundary === "string")
})

test("Accepts custom boundary as the second argument", t => {
  const expected = "BoundaryString123"

  const encoder = new FormDataEncoder(new FormData(), expected)

  t.is(encoder.boundary, `form-data-boundary-${expected}`)
})

test("Has content-type string", t => {
  const encoder = new FormDataEncoder(new FormData())

  t.true(encoder.contentType.startsWith("multipart/form-data; boundary="))
})

test("Has content-type string with custom boundary string", t => {
  const expected = "BoundaryString123"

  const encoder = new FormDataEncoder(new FormData(), expected)

  t.is(
    encoder.contentType,
    `multipart/form-data; boundary=form-data-boundary-${expected}`
  )
})

test("Has correct headers", async t => {
  const encoder = new FormDataEncoder(new FormData())

  t.deepEqual(encoder.headers, {
    "Content-Type": `multipart/form-data; boundary=${encoder.boundary}`,
    "Content-Length": await readStream(encoder).then(({length}) => `${length}`)
  })
})

test("Yields correct footer for empty FormData", async t => {
  const encoder = new FormDataEncoder(new FormData())

  const iterable = readLine(Readable.from(encoder))

  const {value} = await skip(iterable)

  t.is(value, `--${encoder.boundary}--`)
})

test("The footer ends with two crlf", async t => {
  const actual = await readStream(new FormDataEncoder(new FormData()), true)

  t.true(actual.endsWith("\r\n\r\n"))
})

test("Returns correct length of the empty FormData content", async t => {
  const encoder = new FormDataEncoder(new FormData())
  const expected = await readStream(encoder).then(({length}) => length)

  t.is<number>(encoder.getContentLength(), expected)
})

test("Returns the length of the FormData content", async t => {
  const fd = new FormData()

  fd.set("field", "Some string")
  fd.set("file", new File(["Some content"], "file.txt"))

  const encoder = new FormDataEncoder(fd)

  const expected = await readStream(encoder).then(({length}) => length)

  t.is<number>(encoder.getContentLength(), expected)
})

test(".values() yields headers as Uint8Array", t => {
  const fd = new FormData()

  fd.set("field", "Some value")

  const iterable = new FormDataEncoder(fd).values()

  const {value: actual} = skipSync(iterable)

  t.true(actual instanceof Uint8Array)
})

test(".valeus() yields field as Uint8Array", t => {
  const fd = new FormData()

  fd.set("field", "Some value")

  const {value: actual} = skipSync(new FormDataEncoder(fd).values(), 2)

  t.true(actual instanceof Uint8Array)
})

test(".valeus() yields field's content", t => {
  const string = "Some value"
  const expected = new TextEncoder().encode(string)

  const fd = new FormData()

  fd.set("field", string)

  const {value: actual} = skipSync(new FormDataEncoder(fd).values(), 2)

  t.true(Buffer.from(actual as Uint8Array).equals(expected))
})

test(".values() yields a file as is", async t => {
  const file = new File(["File content"], "name.txt")

  const fd = new FormData()

  fd.set("file", file)

  const {value: actual} = skipSync(new FormDataEncoder(fd).values(), 2)

  t.true(actual instanceof File)
  t.is(await (actual as File).text(), await file.text())
})

test("Yields correct headers for a field", async t => {
  const fd = new FormData()

  fd.set("field", "Some value")

  const iterable = readLine(Readable.from(new FormDataEncoder(fd)))

  const {value} = await skip(iterable, 2)

  t.is(value, "Content-Disposition: form-data; name=\"field\"")
})

test("Yields field's content", async t => {
  const expected = "Some value"

  const fd = new FormData()

  fd.set("field", expected)

  const {
    value
  } = await skip(readLine(Readable.from(new FormDataEncoder(fd))), 4)

  t.is(value, expected)
})

test("Yields Content-Disposition header for a File", async t => {
  const fd = new FormData()

  fd.set("file", new File(["My hovercraft is full of eels"], "file.txt"))

  const {
    value
  } = await skip(readLine(Readable.from(new FormDataEncoder(fd))), 2)

  t.is(
    value,
    "Content-Disposition: form-data; name=\"file\"; filename=\"file.txt\""
  )
})

test("Yields Content-Type header for a File", async t => {
  const fd = new FormData()

  fd.set("file", new File(["My hovercraft is full of eels"], "file.txt"), {
    type: "text/plain"
  })

  const {
    value
  } = await skip(readLine(Readable.from(new FormDataEncoder(fd))), 3)

  t.is(value, "Content-Type: text/plain")
})

test(
  "File has default Content-Type set to application/octet-stream",
  async t => {
    const fd = new FormData()

    fd.set("file", new File(["Some content"], "file"))

    const iterable = readLine(Readable.from(new FormDataEncoder(fd)))

    const {value} = await skip(iterable, 3)

    t.is(value, "Content-Type: application/octet-stream")
  }
)

test("Yields File's content", async t => {
  const filePath = "license"
  const fd = new FormData()

  const expected = await fs.readFile(filePath, "utf-8")

  fd.set("license", await fileFromPath(filePath))

  const encoder = new FormDataEncoder(fd)
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

test("Yields every appended field", async t => {
  const expectedDisposition = "Content-Disposition: form-data; name=\"field\""

  const fd = new FormData()

  fd.append("field", "Some string")
  fd.append("field", "Some other string")

  const iterable = readLine(Readable.from(new FormDataEncoder(fd)))

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

  const firstFile = new File(["Some content"], "file.txt", {type: "text/plain"})
  const secondFile = new File(["Some **content**"], "file.md", {
    type: "text/markdown"
  })

  fd.append("file", firstFile)
  fd.append("file", secondFile)

  const iterable = readLine(Readable.from(new FormDataEncoder(fd)))

  const {value: firstFileDisposition} = await skip(iterable, 2)

  t.is(firstFileDisposition, `${expectedDisposition}; filename="file.txt"`)

  const {value: firstFileType} = await skip(iterable)

  t.is(firstFileType, "Content-Type: text/plain")

  const {value: firstFileContent} = await skip(iterable, 2)

  t.is(firstFileContent, await firstFile.text())

  const {value: secondFileDisposition} = await skip(iterable, 2)

  t.is(secondFileDisposition, `${expectedDisposition}; filename="file.md"`)

  const {value: secondFileType} = await skip(iterable)

  t.is(secondFileType, "Content-Type: text/markdown")

  const {value: secondFileContent} = await skip(iterable, 2)

  t.is(secondFileContent, await secondFile.text())
})

test("Can be read through using Blob", async t => {
  const fd = new FormData()

  fd.set("field", "Some field")
  fd.set("file", await fileFromPath("license", {type: "text/plain"}))

  const encoder = new FormDataEncoder(fd)
  const blob = new Blob([...encoder] as any[])

  t.true(
    Buffer
      .from(await blob.arrayBuffer())
      .equals(await readStream(Readable.from(encoder)))
  )
})

test(
  "Throws TypeError when the first argument is not a FormData instance",
  t => {
    // @ts-expect-error
    const trap = () => new FormDataEncoder({})

    t.throws(trap, {
      instanceOf: TypeError,
      message: "Expected first argument to be a FormData instance."
    })
  }
)

test("Throws TypeError when given boundary is not a string", t => {
  // @ts-expect-error
  const trap = () => new FormDataEncoder(new FormData(), 42)

  t.throws(trap, {
    instanceOf: TypeError,
    message: "Expected boundary to be a string."
  })
})
