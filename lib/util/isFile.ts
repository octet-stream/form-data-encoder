import isFunction from "./isFunction"

import {FileLike} from "../FileLike"

const VALID_NAMES = ["File", "Blob"]

/**
 * Check if given object is File.
 *
 * Note that this function will return "false" for Blob, because the Encoder expects FormData to return File when a value is binary data.
 *
 * @param value an object to test
 */
const isFile = (value?: unknown): value is FileLike => Boolean(
  (value as FileLike)
    && typeof (value as FileLike) === "object"
    && isFunction((value as FileLike).constructor)
    && VALID_NAMES.includes((value as FileLike)[Symbol.toStringTag])
    && isFunction((value as FileLike).stream)
    && (value as FileLike).name != null
    && (value as FileLike).size != null
    && (value as FileLike).lastModified != null
)

export default isFile
