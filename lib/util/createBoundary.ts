const alphabet
  = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

/**
 * Generates a boundary string for FormData encoder.
 */
function createBoundary(size: number): string {
  let res = ""

  while (size--) {
    res += alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  return res
}

export default createBoundary
