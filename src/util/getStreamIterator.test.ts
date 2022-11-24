import test from "ava"

import {ReadableStream} from "web-streams-polyfill"
import {stub} from "sinon"

import {getStreamIterator} from "./getStreamIterator.js"

test(
  "Returns readable stream as is, if it implements Symbol.asyncIterator",

  t => {
    const stream = new ReadableStream()

    t.is(getStreamIterator(stream), stream)
  }
)

test(
  "Returns fallback when given stream does not implement Symbol.asyncIterator",

  t => {
    const stream = new ReadableStream()

    stub(stream, Symbol.asyncIterator).get(() => undefined)

    t.false(getStreamIterator(stream) instanceof ReadableStream)
  }
)

test("Reads from the stream using fallback", async t => {
  const expected = "Some text"

  const stream = new ReadableStream({
    pull(controller) {
      controller.enqueue(new TextEncoder().encode(expected))
      controller.close()
    }
  })

  stub(stream, Symbol.asyncIterator).get(() => undefined)

  let actual = ""
  const decoder = new TextDecoder()
  for await (const chunk of getStreamIterator(stream)) {
    actual += decoder.decode(chunk, {stream: true})
  }

  actual += decoder.decode()

  t.is(actual, expected)
})

test("Throws TypeError for unsupported data sources", t => {
  // @ts-expect-error
  const trap = () => getStreamIterator({})

  t.throws(trap, {
    instanceOf: TypeError,
    message: "Unsupported data source: Expected either "
      + "ReadableStream or async iterable."
  })
})
