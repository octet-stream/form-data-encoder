import test from "ava"

import {chunk, MAX_CHUNK_SIZE} from "./chunk.js"

test("Copies the whole value if the size is less <= MAX_CHUNK_SIZE", t => {
  const view = new Uint8Array(MAX_CHUNK_SIZE)
  const chunks = Array.from(chunk(view))

  t.is(Buffer.concat(chunks).byteLength, view.byteLength)
  t.is(chunks[0], view, "Value must be the same object")
  t.is(chunks.length, 1)
})

test("Splits value if the size evenly is MAX_CHUNK_SIZE * n", t => {
  const view = new Uint8Array(MAX_CHUNK_SIZE * 2)
  const chunks = Array.from(chunk(view))

  t.true(chunks.every(ch => ch.byteLength === MAX_CHUNK_SIZE))
  t.is(chunks.length, 2)
})

test("The size of the last chunk can be < MAX_CHUNK_SIZE", t => {
  const expected = 256

  const view = new Uint8Array(MAX_CHUNK_SIZE * 2 + expected)
  const chunks = Array.from(chunk(view))

  t.is(chunks.length, 3)
  t.is(chunks[chunks.length - 1].byteLength, expected)
  t.true(chunks.slice(0, -1).every(ch => ch.byteLength === MAX_CHUNK_SIZE))
})
