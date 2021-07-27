import {randomBytes} from "crypto"

/**
 * Generates a boundary string for FormData encoder.
 */
const createBoundary = (size: number): string => (
  randomBytes(size).toString("hex")
)

export default createBoundary
