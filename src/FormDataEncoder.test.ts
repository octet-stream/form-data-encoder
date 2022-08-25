import {readFile} from "node:fs/promises"
import {Readable} from "node:stream"
import {EOL} from "node:os"

import test from "ava"

// eslint-disable-next-line import/no-unresolved
import {fileFromPath} from "formdata-node/file-from-path"

import {FormData, Blob, File} from "formdata-node"

import skipSync from "./__helper__/skipIterationsSync.js"
import readStream from "./__helper__/readStream.js"
import skip from "./__helper__/skipIterations.js"
import readLine from "./__helper__/readLine.js"

import {FormDataEncoder} from "./FormDataEncoder.js"

test("Has boundary string", t => {
  const encoder = new FormDataEncoder(new FormData())

  t.true("boundary" in encoder)
  t.is(typeof encoder.boundary, "string")
})

test("boundary property is read-only", t => {
  const encoder = new FormDataEncoder(new FormData())

  const {boundary: expected} = encoder

  // @ts-expect-error
  try { encoder.boundary = "some string" } catch { /* noop */ }

  t.is(encoder.boundary, expected)
})

test("boundary property cannot be deleted", t => {
  const encoder = new FormDataEncoder(new FormData())

  const {boundary: expected} = encoder

  // @ts-expect-error
  try { delete encoder.boundary } catch { /* noop */ }

  t.is(encoder.boundary, expected)
})

test("Accepts custom boundary as the second argument", t => {
  const expected = "BoundaryString123"

  const encoder = new FormDataEncoder(new FormData(), expected)

  t.is(encoder.boundary, `form-data-boundary-${expected}`)
})

test("Has content-type string", t => {
  const encoder = new FormDataEncoder(new FormData())

  t.true("contentType" in encoder)
  t.is(typeof encoder.contentType, "string")
  t.true(encoder.contentType.startsWith("multipart/form-data; boundary="))
})

test("contentType property is read-only", t => {
  const encoder = new FormDataEncoder(new FormData())

  const {contentType: expected} = encoder

  // @ts-expect-error
  try { encoder.contentType = "application/json" } catch { /* noop */ }

  t.is(encoder.contentType, expected)
})

test("contentType cannot be deleted", t => {
  const encoder = new FormDataEncoder(new FormData())

  const {contentType: expected} = encoder

  // @ts-expect-error
  try { delete encoder.contentType } catch { /* noop */ }

  t.is(encoder.contentType, expected)
})

test("Has content-type string with custom boundary string", t => {
  const expected = "BoundaryString123"

  const encoder = new FormDataEncoder(new FormData(), expected)

  t.is(
    encoder.contentType,
    `multipart/form-data; boundary=form-data-boundary-${expected}`
  )
})

test("Has contentLength property", async t => {
  const encoder = new FormDataEncoder(new FormData())

  t.true("contentLength" in encoder)
  t.is(typeof encoder.contentLength, "string")
  t.is(
    encoder.contentLength,

    await readStream(encoder).then(({length}) => `${length}`)
  )
})

test("contentLength property is read-only", t => {
  const encoder = new FormDataEncoder(new FormData())

  const {contentLength: expected} = encoder

  // @ts-expect-error
  try { encoder.contentLength = String(Date.now()) } catch { /* noop */ }

  t.is(encoder.contentLength, expected)
})

test("contentLength property cannot be deleted", t => {
  const encoder = new FormDataEncoder(new FormData())

  const {contentLength: expected} = encoder

  // @ts-expect-error
  try { encoder.contentLength = String(Date.now()) } catch { /* noop */ }

  t.is(encoder.contentLength, expected)
})

test("Has correct headers", async t => {
  const encoder = new FormDataEncoder(new FormData())

  t.deepEqual({...encoder.headers}, {
    "Content-Type": `multipart/form-data; boundary=${encoder.boundary}`,
    "Content-Length": await readStream(encoder).then(({length}) => `${length}`)
  })
})

test("Headers can be accessed by lowercased keys", async t => {
  const encoder = new FormDataEncoder(new FormData())

  t.true("content-type" in encoder.headers)
  t.is(
    encoder.headers["content-type"],

    `multipart/form-data; boundary=${encoder.boundary}`
  )

  t.true("content-length" in encoder.headers)
  t.is(
    encoder.headers["content-length"],

    await readStream(encoder).then(({length}) => `${length}`)
  )
})

test("FormDataEncoder.headers property is read-only", t => {
  const encoder = new FormDataEncoder(new FormData())

  const expected = {...encoder.headers}

  // @ts-expect-error
  try { encoder.headers = {foo: "foo"} } catch { /* noop */ }

  t.deepEqual({...encoder.headers}, expected)
})

test("Content-Type header is read-only", t => {
  const {headers} = new FormDataEncoder(new FormData())

  const expected = headers["Content-Type"]

  // @ts-expect-error
  try { headers["Content-Type"] = "can't override" } catch { /* noop */ }

  t.is(headers["Content-Type"], expected)
})

test("Content-Length header is read-only", t => {
  const {headers} = new FormDataEncoder(new FormData())

  const expected = headers["Content-Length"]

  // @ts-expect-error
  try { headers["Content-Length"] = "can't override" } catch { /* noop */ }

  t.is(headers["Content-Length"], expected)
})

test(
  "Does not return Content-Length header "
    + "if FormData has entry without known length",

  t => {
    const form = new FormData()

    form.set("stream", {
      [Symbol.toStringTag]: "File",
      name: "file.txt",
      stream() { }
    })

    const encoder = new FormDataEncoder(form)

    t.false("Content-Length" in encoder.headers)
  }
)

test("Yields correct footer for empty FormData", async t => {
  const encoder = new FormDataEncoder(new FormData())

  const iterable = readLine(Readable.from(encoder))

  const {value} = await skip(iterable)

  t.is(value, `--${encoder.boundary}--`)
})

test("The footer ends with double crlf", async t => {
  const actual = await readStream(new FormDataEncoder(new FormData()), true)

  t.true(actual.endsWith("\r\n\r\n"))
})

test(".values() yields headers as Uint8Array", t => {
  const form = new FormData()

  form.set("field", "Some value")

  const iterable = new FormDataEncoder(form).values()

  const {value: actual} = skipSync(iterable)

  t.true(actual instanceof Uint8Array)
})

test(".valeus() yields field as Uint8Array", t => {
  const form = new FormData()

  form.set("field", "Some value")

  const {value: actual} = skipSync(new FormDataEncoder(form).values(), 2)

  t.true(actual instanceof Uint8Array)
})

test(".valeus() yields field's content", t => {
  const string = "Some value"
  const expected = new TextEncoder().encode(string)

  const form = new FormData()

  form.set("field", string)

  const {value: actual} = skipSync(new FormDataEncoder(form).values(), 2)

  t.true(Buffer.from(actual as Uint8Array).equals(expected))
})

test(".values() yields a file as is", async t => {
  const file = new File(["File content"], "name.txt")

  const form = new FormData()

  form.set("file", file)

  const {value: actual} = skipSync(new FormDataEncoder(form).values(), 2)

  t.true(actual instanceof File)
  t.is(await (actual as File).text(), await file.text())
})

test("Yields correct headers for a field", async t => {
  const form = new FormData()

  form.set("field", "Some value")

  const iterable = readLine(Readable.from(new FormDataEncoder(form)))

  const {value} = await skip(iterable, 2)

  t.is(value, "Content-Disposition: form-data; name=\"field\"")
})

test("Yields field's content", async t => {
  const expected = "Some value"

  const form = new FormData()

  form.set("field", expected)

  const {
    value
  } = await skip(readLine(Readable.from(new FormDataEncoder(form))), 4)

  t.is(value, expected)
})

test("Yields Content-Disposition header for a File", async t => {
  const form = new FormData()

  form.set("file", new File(["My hovercraft is full of eels"], "file.txt"))

  const {
    value
  } = await skip(readLine(Readable.from(new FormDataEncoder(form))), 2)

  t.is(
    value,
    "Content-Disposition: form-data; name=\"file\"; filename=\"file.txt\""
  )
})

test("Yields Content-Type header for a File", async t => {
  const form = new FormData()

  form.set("file", new File(["My hovercraft is full of eels"], "file.txt", {
    type: "text/plain"
  }))

  const {
    value
  } = await skip(readLine(Readable.from(new FormDataEncoder(form))), 3)

  t.is(value, "Content-Type: text/plain")
})

test(
  "File has default Content-Type set to application/octet-stream",
  async t => {
    const form = new FormData()

    form.set("file", new File(["Some content"], "file"))

    const iterable = readLine(Readable.from(new FormDataEncoder(form)))

    const {value} = await skip(iterable, 3)

    t.is(value, "Content-Type: application/octet-stream")
  }
)

test(
  "Yields Content-Length File header when enableAdditionalHeaders option is on",

  async t => {
    const form = new FormData()
    const file = new File(["Some content"], "file")

    form.set("file", file)

    const iterable = readLine(Readable.from(new FormDataEncoder(form, {
      enableAdditionalHeaders: true
    })))

    const {value} = await skip(iterable, 4)

    t.is(value, `Content-Length: ${file.size}`)
  }
)

test(
  "Yields Content-Length header when enableAdditionalHeaders option is on",

  async t => {
    const form = new FormData()
    const field = "Some value"

    form.set("field", field)

    const iterable = readLine(Readable.from(new FormDataEncoder(form, {
      enableAdditionalHeaders: true
    })))

    const {value} = await skip(iterable, 3)

    t.is(value, `Content-Length: ${Buffer.byteLength(field)}`)
  }
)

test(
  "Does not include Content-Length header with enableAdditionalHeaders "
    + "option if entry does not have known length",

  async t => {
    const form = new FormData()

    form.set("stream", {
      [Symbol.toStringTag]: "File",
      name: "file.txt",
      stream() {
        return Readable.from([Buffer.from("foo")])
      }
    })

    const encoder = new FormDataEncoder(form, {
      enableAdditionalHeaders: true
    })

    const iterable = readLine(Readable.from(encoder))

    await skip(iterable, 1)
    const headers: string[] = []
    for await (const chunk of iterable) {
      if (chunk === "") {
        break
      }

      headers.push(chunk.split(":")[0].toLowerCase())
    }

    t.false(headers.includes("content-length"))
  }
)

test("Yields File's content", async t => {
  const filePath = "license"
  const form = new FormData()

  const expected = await readFile(filePath, "utf-8")

  form.set("license", await fileFromPath(filePath))

  const encoder = new FormDataEncoder(form)
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

  // It looks like files on Windows have different EOL when you read them, even though they were created on macOS x)
  t.is<string, string>(chunks.join(EOL), expected)
})

test("Yields every appended field", async t => {
  const expectedDisposition = "Content-Disposition: form-data; name=\"field\""

  const form = new FormData()

  form.append("field", "Some string")
  form.append("field", "Some other string")

  const iterable = readLine(Readable.from(new FormDataEncoder(form)))

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

  const form = new FormData()

  const firstFile = new File(["Some content"], "file.txt", {type: "text/plain"})
  const secondFile = new File(["Some **content**"], "file.md", {
    type: "text/markdown"
  })

  form.append("file", firstFile)
  form.append("file", secondFile)

  const iterable = readLine(Readable.from(new FormDataEncoder(form)))

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
  const form = new FormData()

  form.set("field", "Some field")
  form.set("file", await fileFromPath("license", {type: "text/plain"}))

  const encoder = new FormDataEncoder(form)
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
    message: "Expected boundary argument to be a string."
  })
})

test("Throws TypeError when options argument is not an object", t => {
  // @ts-expect-error
  const trap = () => new FormDataEncoder(new FormData(), undefined, "451")

  t.throws(trap, {
    instanceOf: TypeError,
    message: "Expected options argument to be an object."
  })
})
