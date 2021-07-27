/**
 * Generates a boundary string of given length.
 */
function createBoundary(length: number): string {
  const octets = new Uint8Array(length)

  crypto.getRandomValues(octets)

  return [...octets]
    .map<string>(octet => octet.toString(16).padStart(2, "0"))
    .join("")
}

export default createBoundary
