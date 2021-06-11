import {FileLike} from "./FileLike"

/**
 * This interface reflects possible values of each FormData entry
 */
export type FormDataEntryValue = string | FileLike

/**
 * This interface reflects minimal shape of the FormData
 */
export interface FormDataLike {
  append(name: string, value: unknown, filename?: string): void

  getAll(name: string): FormDataEntryValue[]

  entries(): Generator<[string, FormDataEntryValue]>

  [Symbol.iterator](): Generator<[string, FormDataEntryValue]>

  [Symbol.toStringTag]: string
}
