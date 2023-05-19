import type {FileLike} from "../FileLike.js"

import {isFunction} from "./isFunction.js"

/**
 * Check if given object is `File`.
 *
 * Note that this function will return `false` for Blob, because the FormDataEncoder expects FormData to return File when a value is binary data.
 *
 * @param value an object to test
 *
 * @api public
 *
 * This function will return `true` for FileAPI compatible `File` objects:
 *
 * ```ts
 * import {createReadStream} from "node:fs"
 *
 * import {isFile} from "form-data-encoder"
 *
 * isFile(new File(["Content"], "file.txt")) // -> true
 * ```
 *
 * However, if you pass a Node.js `Buffer`, or `Blob`, or `ReadStream`, it will return `false`:
 *
 * ```js
 * import {isFile} from "form-data-encoder"
 *
 * isFile(Buffer.from("Content")) // -> false
 * isFile(new Blob(["Content"])) // -> false
 * isFile(createReadStream("path/to/a/file.txt")) // -> false
 * ```
 */
export const isFile = (value: unknown): value is FileLike => Boolean(
  (value as FileLike)
    && typeof (value as FileLike) === "object"
    && isFunction((value as FileLike).constructor)
    && (value as FileLike)[Symbol.toStringTag] === "File"
    && isFunction((value as FileLike).stream)
    && (value as FileLike).name != null
)
