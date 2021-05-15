import {customAlphabet} from "nanoid"

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
const generate = customAlphabet(alphabet, 16)

/**
 * Generates a boundary string for FormData encoder.
 */
const createBoundary = (): string => `form-data-boundary-${generate()}`

export default createBoundary
