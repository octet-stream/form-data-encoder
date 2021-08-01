const alphabet
  = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

/**
 * Generates a boundary string for FormData encoder.
 *
 * @param size The size of the resulting string
 */
function createBoundary(size: number): string {
  let res = ""

  while (size--) {
    res += alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  return res
}

export default createBoundary
