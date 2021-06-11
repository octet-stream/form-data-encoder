export interface FileLike {
  name: string

  type: string

  size: number

  lastModified: number

  stream(): {[Symbol.asyncIterator](): AsyncIterableIterator<Uint8Array>}

  [Symbol.toStringTag]: string
}
