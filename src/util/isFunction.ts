/**
 * Checks if given value is a function.
 *
 * @api private
 */
export const isFunction = (value: unknown): value is Function => (
  typeof value === "function"
)
