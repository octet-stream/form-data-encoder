import test from "ava"

import {ReadableStream} from "web-streams-polyfill"
import {stub} from "sinon"

import {getStreamIterator} from "./getStreamIterator.js"
import {isAsyncIterable} from "./isAsyncIterable.js"

test("Returns async iterable for streams w/ Symbol.asyncIterator", t => {
  const stream = new ReadableStream()

  t.true(isAsyncIterable(getStreamIterator(stream)))
})

test("Iterates over given stream", async t => {
  const expected = "Some text"

  const stream = new ReadableStream({
    pull(controller) {
      controller.enqueue(new TextEncoder().encode(expected))
      controller.close()
    }
  })

  let actual = ""
  const decoder = new TextDecoder()
  for await (const chunk of getStreamIterator(stream)) {
    actual += decoder.decode(chunk, {stream: true})
  }

  actual += decoder.decode()

  t.is(actual, expected)
})

test("Returns async iterable for streams w/o Symbol.asyncIterator", t => {
  const stream = new ReadableStream()

  stub(stream, Symbol.asyncIterator).get(() => undefined)

  t.false(getStreamIterator(stream) instanceof ReadableStream)
})

test("Iterates over the stream using fallback", async t => {
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
