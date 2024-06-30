type Unwrap<T> = T extends Generator<infer Y> ? Y : T

// biome-ignore lint/suspicious/noExplicitAny: Intended use of amy
function skipIterationsSync<T extends Generator<any>>(
  iterable: T,
  iterations = 1
): IteratorResult<Unwrap<T>, void> {
  while (--iterations) {
    iterable.next()
  }

  return iterable.next()
}

export default skipIterationsSync
