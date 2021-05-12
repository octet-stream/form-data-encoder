async function skipIterations<
  T extends AsyncGenerator
>(iterable: T, iterations = 1): Promise<ReturnType<T["next"]>> {
  while (--iterations) {
    await iterable.next()
  }

  return iterable.next()
}

export default skipIterations
