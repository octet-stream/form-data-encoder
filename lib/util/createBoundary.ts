import {randomBytes} from "crypto"

/**
 * Generates a boundary string for FormData encoder.
 */
const createBoundary = (): string => (
  `form-data-boundary-${randomBytes(16).toString("hex")}`
)

export default createBoundary
