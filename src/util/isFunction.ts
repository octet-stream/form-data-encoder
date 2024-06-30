// biome-ignore lint/suspicious/noExplicitAny: Intended use of any to cover any possible function type
type AnyFunction = (...args: any[]) => any

/**
 * Checks if given value is a function.
 *
 * @api private
 */
export const isFunction = (value: unknown): value is AnyFunction =>
  typeof value === "function"
