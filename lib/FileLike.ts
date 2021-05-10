export interface FileLike {
  name: string

  type: string

  size: number

  lastModified: number

  stream(): AsyncIterableIterator<any>

  [Symbol.toStringTag]: string
}
