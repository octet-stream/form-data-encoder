import {isFunction} from "./isFunction.js"

/**
 * Checks if the value is async iterable
 */
export const isAsyncIterable = (
  value: object
): value is AsyncIterable<Uint8Array> => (
  isFunction((value as AsyncIterable<Uint8Array>)[Symbol.asyncIterator])
)
