export interface FileLike {
  name: string

  type: string

  size: number

  lastModified: number

  stream(): {[Symbol.asyncIterator](): AsyncIterableIterator<any>}

  [Symbol.toStringTag]: string
}
