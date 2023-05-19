/* eslint-disable no-restricted-globals */

import type {RawHeaders, FormDataEncoderHeaders} from "./util/Headers.js"
import {getStreamIterator} from "./util/getStreamIterator.js"
import {createBoundary} from "./util/createBoundary.js"
import {normalizeValue} from "./util/normalizeValue.js"
import {isPlainObject} from "./util/isPlainObject.js"
import {proxyHeaders} from "./util/proxyHeaders.js"
import type {FormDataLike} from "./FormDataLike.js"
import {isFormData} from "./util/isFormData.js"
import {escapeName} from "./util/escapeName.js"
import type {FileLike} from "./FileLike.js"
import {isFile} from "./util/isFile.js"
import {chunk} from "./util/chunk.js"

type FormDataEntryValue = string | FileLike

export interface FormDataEncoderOptions {
  /**
   * When enabled, the encoder will emit additional per part headers, such as `Content-Length`.
   *
   * Please note that the web clients do not include these, so when enabled this option might cause an error if `multipart/form-data` does not consider additional headers.
   *
   * Defaults to `false`.
   */
  enableAdditionalHeaders?: boolean
}

const defaultOptions: FormDataEncoderOptions = {
  enableAdditionalHeaders: false
}

const readonlyProp: PropertyDescriptor = {writable: false, configurable: false}

/**
 * Implements [`multipart/form-data` encoding algorithm](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#multipart/form-data-encoding-algorithm),
 * allowing to add support for spec-comliant [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) to an HTTP client.
 */
export class FormDataEncoder {
  readonly #CRLF: string = "\r\n"

  readonly #CRLF_BYTES: Uint8Array

  readonly #CRLF_BYTES_LENGTH: number

  readonly #DASHES = "-".repeat(2)

  /**
   * TextEncoder instance
   */
  readonly #encoder = new TextEncoder()

  /**
   * Returns form-data footer bytes
   */
  readonly #footer: Uint8Array

  /**
   * FormData instance
   */
  readonly #form: [string, FormDataEntryValue][]

  /**
   * Instance options
   */
  readonly #options: FormDataEncoderOptions

  /**
   * Returns boundary string
   */
  readonly boundary: string

  /**
   * Returns Content-Type header
   */
  readonly contentType: string

  /**
   * Returns Content-Length header
   */
  readonly contentLength: string | undefined

  /**
   * Returns headers object with Content-Type and Content-Length header
   */
  readonly headers: Readonly<FormDataEncoderHeaders>

  /**
   * Creates a multipart/form-data encoder.
   *
   * @param form FormData object to encode. This object must be a spec-compatible FormData implementation.
   *
   * @example
   *
   * ```js
   * import {Readable} from "stream"
   *
   * import {FormData, File, fileFromPath} from "formdata-node"
   * import {FormDataEncoder} from "form-data-encoder"
   *
   * import fetch from "node-fetch"
   *
   * const form = new FormData()
   *
   * form.set("field", "Just a random string")
   * form.set("file", new File(["Using files is class amazing"], "file.txt"))
   * form.set("fileFromPath", await fileFromPath("path/to/a/file.txt"))
   *
   * const encoder = new FormDataEncoder(form)
   *
   * const options = {
   *   method: "post",
   *   headers: encoder.headers,
   *   body: Readable.from(encoder)
   * }
   *
   * const response = await fetch("https://httpbin.org/post", options)
   *
   * console.log(await response.json())
   * ```
   */
  constructor(form: FormDataLike)

  /**
   * Creates multipart/form-data encoder with custom boundary string.
   *
   * @param form FormData object to encode. This object must be a spec-compatible FormData implementation.
   * @param boundary An optional boundary string that will be used by the encoder. If there's no boundary string is present, Encoder will generate it automatically.
   */
  constructor(form: FormDataLike, boundary: string)

  /**
   * Creates multipart/form-data encoder with additional options.
   *
   * @param form FormData object to encode. This object must be a spec-compatible FormData implementation.
   * @param options Additional options
   */
  constructor(form: FormDataLike, options: FormDataEncoderOptions)
  constructor(
    form: FormDataLike,
    boundary: string,
    options?: FormDataEncoderOptions
  )
  constructor(
    form: FormDataLike,
    boundaryOrOptions?: string | FormDataEncoderOptions,
    options?: FormDataEncoderOptions
  ) {
    if (!isFormData(form)) {
      throw new TypeError("Expected first argument to be a FormData instance.")
    }

    let boundary: string | undefined
    if (isPlainObject(boundaryOrOptions)) {
      options = boundaryOrOptions
    } else {
      boundary = boundaryOrOptions
    }

    // Use default generator when the boundary argument is not present
    if (!boundary) {
      boundary = createBoundary()
    }

    if (typeof boundary !== "string") {
      throw new TypeError("Expected boundary argument to be a string.")
    }

    if (options && !isPlainObject(options)) {
      throw new TypeError("Expected options argument to be an object.")
    }

    this.#form = Array.from(form.entries())

    this.#options = {...defaultOptions, ...options}

    this.#CRLF_BYTES = this.#encoder.encode(this.#CRLF)
    this.#CRLF_BYTES_LENGTH = this.#CRLF_BYTES.byteLength

    this.boundary = `form-data-boundary-${boundary}`
    this.contentType = `multipart/form-data; boundary=${this.boundary}`

    this.#footer = this.#encoder.encode(
      `${this.#DASHES}${this.boundary}${this.#DASHES}${this.#CRLF.repeat(2)}`
    )

    const headers: RawHeaders = {
      "Content-Type": this.contentType
    }

    const contentLength = this.#getContentLength()
    if (contentLength) {
      this.contentLength = contentLength
      headers["Content-Length"] = contentLength
    }

    this.headers = proxyHeaders(Object.freeze(headers))

    // Make sure following properties read-only in runtime.
    Object.defineProperties(this, {
      boundary: readonlyProp,
      contentType: readonlyProp,
      contentLength: readonlyProp,
      headers: readonlyProp
    })
  }

  #getFieldHeader(name: string, value: FileLike | Uint8Array): Uint8Array {
    let header = ""

    header += `${this.#DASHES}${this.boundary}${this.#CRLF}`
    header += `Content-Disposition: form-data; name="${escapeName(name)}"`

    if (isFile(value)) {
      header += `; filename="${escapeName(value.name)}"${this.#CRLF}`
      header += `Content-Type: ${value.type || "application/octet-stream"}`
    }

    if (this.#options.enableAdditionalHeaders === true) {
      const size = isFile(value) ? value.size : value.byteLength
      if (size != null && !isNaN(size)) {
        header += `${this.#CRLF}Content-Length: ${size}`
      }
    }

    return this.#encoder.encode(`${header}${this.#CRLF.repeat(2)}`)
  }

  /**
   * Returns form-data content length
   */
  #getContentLength(): string | undefined {
    let length = 0

    for (const [name, raw] of this.#form) {
      const value = isFile(raw) ? raw : this.#encoder.encode(
        normalizeValue(raw)
      )

      const size = isFile(value) ? value.size : value.byteLength

      // Return `undefined` if encountered part without known size
      if (size == null || isNaN(size)) {
        return undefined
      }

      length += this.#getFieldHeader(name, value).byteLength

      length += size

      length += this.#CRLF_BYTES_LENGTH
    }

    return String(length + this.#footer.byteLength)
  }

  /**
   * Creates an iterator allowing to go through form-data parts (with metadata).
   * This method **will not** read the files and **will not** split values big into smaller chunks.
   *
   * Using this method, you can convert form-data content into Blob:
   *
   * @example
   *
   * ```ts
   * import {Readable} from "stream"
   *
   * import {FormDataEncoder} from "form-data-encoder"
   *
   * import {FormData} from "formdata-polyfill/esm-min.js"
   * import {fileFrom} from "fetch-blob/form.js"
   * import {File} from "fetch-blob/file.js"
   * import {Blob} from "fetch-blob"
   *
   * import fetch from "node-fetch"
   *
   * const form = new FormData()
   *
   * form.set("field", "Just a random string")
   * form.set("file", new File(["Using files is class amazing"]))
   * form.set("fileFromPath", await fileFrom("path/to/a/file.txt"))
   *
   * const encoder = new FormDataEncoder(form)
   *
   * const options = {
   *   method: "post",
   *   body: new Blob(encoder, {type: encoder.contentType})
   * }
   *
   * const response = await fetch("https://httpbin.org/post", options)
   *
   * console.log(await response.json())
   * ```
   */
  * values(): Generator<Uint8Array | FileLike, void, undefined> {
    for (const [name, raw] of this.#form) {
      const value = isFile(raw) ? raw : this.#encoder.encode(
        normalizeValue(raw)
      )

      yield this.#getFieldHeader(name, value)

      yield value

      yield this.#CRLF_BYTES
    }

    yield this.#footer
  }

  /**
   * Creates an async iterator allowing to perform the encoding by portions.
   * This method reads through files and splits big values into smaller pieces (65536 bytes per each).
   *
   * @example
   *
   * ```ts
   * import {Readable} from "stream"
   *
   * import {FormData, File, fileFromPath} from "formdata-node"
   * import {FormDataEncoder} from "form-data-encoder"
   *
   * import fetch from "node-fetch"
   *
   * const form = new FormData()
   *
   * form.set("field", "Just a random string")
   * form.set("file", new File(["Using files is class amazing"], "file.txt"))
   * form.set("fileFromPath", await fileFromPath("path/to/a/file.txt"))
   *
   * const encoder = new FormDataEncoder(form)
   *
   * const options = {
   *   method: "post",
   *   headers: encoder.headers,
   *   body: Readable.from(encoder.encode()) // or Readable.from(encoder)
   * }
   *
   * const response = await fetch("https://httpbin.org/post", options)
   *
   * console.log(await response.json())
   * ```
   */
  async* encode(): AsyncGenerator<Uint8Array, void, undefined> {
    for (const part of this.values()) {
      if (isFile(part)) {
        yield* getStreamIterator(part.stream())
      } else {
        yield* chunk(part)
      }
    }
  }

  /**
   * Creates an iterator allowing to read through the encoder data using for...of loops
   */
  [Symbol.iterator](): Generator<Uint8Array | FileLike, void, undefined> {
    return this.values()
  }

  /**
   * Creates an **async** iterator allowing to read through the encoder data using for-await...of loops
   */
  [Symbol.asyncIterator](): AsyncGenerator<Uint8Array, void, undefined> {
    return this.encode()
  }
}
