/**
 * Checks if given value is a function.
 *
 * @api private
 */
const isFunction = (value: unknown): value is Function => (
  typeof value === "function"
)

export default isFunction
