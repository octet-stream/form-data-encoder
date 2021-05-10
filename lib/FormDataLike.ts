import {FileLike} from "./FileLike"

export type FormDataEntryValue = string | FileLike

export interface FormDataLike {
  set(name: string, value: unknown): void

  append(name: string, value: unknown): void

  has(name: string): boolean

  get(name: string): null | FormDataEntryValue

  getAll(name: string): Array<null | FormDataEntryValue>

  delete(name: string): void

  keys(): IterableIterator<string>

  values(): IterableIterator<FormDataEntryValue>

  entries(): IterableIterator<[string, FormDataEntryValue]>

  [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]>

  [Symbol.toStringTag]: string
}
