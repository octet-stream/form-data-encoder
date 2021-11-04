// TODO: Return uppercase characters back once the spec gets fixed.
// Keep track on these:
// 1. https://github.com/whatwg/html/issues/6251
// 2. https://github.com/w3c/FileAPI/issues/43
const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"

/**
 * Generates a boundary string for FormData encoder.
 *
 * @api private
 *
 * ```js
 * import createBoundary from "./util/createBoundary"
 *
 * createBoundary() // -> n2vw38xdagaq6lrv
 * ```
 */
function createBoundary(): string {
  let size = 16
  let res = ""

  while (size--) {
    // I use bitwise `<<` for slightly more performant string fill.
    // It will do basically the same thing as `Math.trunc()`,
    // except it only support signed 32-bit integers.
    // Because the result of this operation will always be
    // a number in range `0` and `alphabet.length - 1` (inclusive),
    // we don't need `Math.floor()` too.
    /* eslint no-bitwise: ["error", {"allow": ["<<"]}] */
    res += alphabet[(Math.random() * alphabet.length) << 0]
  }

  return res
}

export default createBoundary
