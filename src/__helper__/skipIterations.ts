type Unwrap<T> = T extends AsyncGenerator<infer U> ? U : T

async function skipIterations<T extends AsyncGenerator<any>>(
  iterable: T,
  iterations = 1
): Promise<IteratorResult<Unwrap<T>, void>> {
  while (--iterations) {
    await iterable.next()
  }

  return iterable.next()
}

export default skipIterations
