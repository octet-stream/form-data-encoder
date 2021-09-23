import createBoundary from "./util/createBoundary"
import isPlainObject from "./util/isPlainObject"
import normalize from "./util/normalizeValue"
import isFormData from "./util/isFormData"
import escape from "./util/escapeName"
import isFile from "./util/isFile"

import {FormDataLike} from "./FormDataLike"
import {FileLike} from "./FileLike"

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

const defaultOptionss: FormDataEncoderOptions = {
  enableAdditionalHeaders: false
}

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
  readonly #form: FormDataLike

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
  readonly contentLength: string

  /**
   * Returns headers object with Content-Type and Content-Length header
   */
  readonly headers: {
    "Content-Type": string
    "Content-Length": string
  }

  /**
   * Creates a multipart/form-data encoder.
   *
   * @param form FormData object to encode. This object must be a spec-compatible FormData implementation.
   * @param boundary An optional boundary string that will be used by the encoder. If there's no boundary string is present, Encoder will generate it automatically.
   *
   * @example
   *
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
   */
  constructor(form: FormDataLike)
  constructor(form: FormDataLike, boundary: string)
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

    // ? Should I preserve FormData entries in array instead?
    // ? That way it will be immutable, but require to allocate a new array
    // ? and go through entries during initialization.
    this.#form = form

    this.#options = {...defaultOptionss, ...options}

    this.#CRLF_BYTES = this.#encoder.encode(this.#CRLF)
    this.#CRLF_BYTES_LENGTH = this.#CRLF_BYTES.byteLength

    this.boundary = `form-data-boundary-${boundary}`
    this.contentType = `multipart/form-data; boundary=${this.boundary}`

    this.#footer = this.#encoder.encode(
      `${this.#DASHES}${this.boundary}${this.#DASHES}${this.#CRLF.repeat(2)}`
    )

    this.contentLength = String(this.getContentLength())

    this.headers = Object.freeze({
      "Content-Type": this.contentType,
      "Content-Length": this.contentLength
    })

    // Make sure following properties read-only in runtime.
    Object.defineProperties(this, {
      boundary: {writable: false, configurable: false},
      contentType: {writable: false, configurable: false},
      contentLength: {writable: false, configurable: false},
      headers: {writable: false, configurable: false}
    })
  }

  #getFieldHeader(name: string, value: FileLike | Uint8Array): Uint8Array {
    let header = ""

    header += `${this.#DASHES}${this.boundary}${this.#CRLF}`
    header += `Content-Disposition: form-data; name="${escape(name)}"`

    if (isFile(value)) {
      header += `; filename="${escape(value.name)}"${this.#CRLF}`
      header += `Content-Type: ${value.type || "application/octet-stream"}`
    }

    if (this.#options.enableAdditionalHeaders === true) {
      header += `${this.#CRLF}Content-Length: ${
        isFile(value) ? value.size : value.byteLength
      }`
    }

    return this.#encoder.encode(`${header}${this.#CRLF.repeat(2)}`)
  }

  /**
   * Returns form-data content length
   */
  getContentLength(): number {
    let length = 0

    for (const [name, raw] of this.#form) {
      const value = isFile(raw) ? raw : this.#encoder.encode(normalize(raw))

      length += this.#getFieldHeader(name, value).byteLength

      length += isFile(value) ? value.size : value.byteLength

      length += this.#CRLF_BYTES_LENGTH
    }

    return length + this.#footer.byteLength
  }

  /**
   * Creates an iterator allowing to go through form-data parts (with metadata).
   * This method **will not** read the files.
   *
   * Using this method, you can convert form-data content into Blob:
   *
   * @example
   *
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
   */
  * values(): Generator<Uint8Array | FileLike, void, undefined> {
    for (const [name, raw] of this.#form.entries()) {
      const value = isFile(raw) ? raw : this.#encoder.encode(normalize(raw))

      yield this.#getFieldHeader(name, value)

      yield value

      yield this.#CRLF_BYTES
    }

    yield this.#footer
  }

  /**
   * Creates an async iterator allowing to perform the encoding by portions.
   * This method **will** also read files.
   *
   * @example
   *
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
   */
  async* encode(): AsyncGenerator<Uint8Array, void, undefined> {
    for (const part of this.values()) {
      if (isFile(part)) {
        yield* part.stream()
      } else {
        yield part
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

/**
 * @deprecated Use FormDataEncoder to import the encoder class instead
 */
/* c8 ignore next */
export const Encoder = FormDataEncoder
