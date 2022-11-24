import {isFunction} from "./isFunction.js"

/**
 * Checks if the value is async iterable
 */
const isAsyncIterable = (
  value: unknown
): value is AsyncIterable<Uint8Array> => (
  isFunction((value as AsyncIterable<Uint8Array>)[Symbol.asyncIterator])
)

/**
 * Reads from given ReadableStream
 *
 * @param readable A ReadableStream to read from
 */
async function* readStream(
  readable: ReadableStream<Uint8Array>
): AsyncGenerator<Uint8Array, void, undefined> {
  const reader = readable.getReader()

  while (true) {
    const {done, value} = await reader.read()

    if (done) {
      break
    }

    yield value
  }
}

/**
 * Turns ReadableStream into async iterable when the `Symbol.asyncIterable` is not implemented on given stream.
 *
 * @param source A ReadableStream to create async iterator for
 */
export const getStreamIterator = (
  source: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>
): AsyncIterable<Uint8Array> => {
  if (isAsyncIterable(source)) {
    return source
  }

  if (isFunction(source.getReader)) {
    return readStream(source)
  }

  // Throw an error otherwise (for example, in case if encountered Node.js Readable stream without Symbol.asyncIterator method)
  throw new TypeError(
    "Unsupported data source: Expected either ReadableStream or async iterable."
  )
}
