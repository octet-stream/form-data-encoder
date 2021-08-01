import createBoundary from "./util/createBoundary"
import escape from "./util/escapeName"
import isFormData from "./util/isFormData"
import isFile from "./util/isFile"

import {FormDataLike} from "./FormDataLike"
import {FileLike} from "./FileLike"

export class Encoder {
  /**
   * Returns boundary string
   */
  readonly boundary: string

  /**
   * Returns Content-Type header for multipart/form-data
   */
  readonly contentType: string

  /**
   * Returns headers object with Content-Type and Content-Length header
   */
  readonly headers: {
    "Content-Type": string
    "Content-Length": number
  }

  readonly #CRLF: string

  readonly #CRLF_BYTES: Uint8Array

  readonly #CRLF_BYTES_LENGTH: number

  readonly #DASHES = "-".repeat(2)

  /**
   * TextEncoder instance
   */
  readonly #encoder: TextEncoder

  /**
   * Returns form-data footer bytes
   */
  readonly #footer: Uint8Array

  /**
   * FormData instance
   */
  readonly #form: FormDataLike

  /**
   * Creates a multipart/form-data encoder.
   *
   * @param form - FormData object to encode. This object must be a spec-compatible FormData implementation.
   * @param boundary - An optional boundary string that will be used by the encoder. If there's no boundary string is present, Encoder will generate it automatically.
   *
   * @example
   *
   * import {Encoder} from "form-data-encoder"
   * import {FormData} from "formdata-node"
   *
   * const fd = new FormData()
   *
   * fd.set("greeting", "Hello, World!")
   *
   * const encoder = new Encoder(fd)
   */
  constructor(form: FormDataLike, boundary: string = createBoundary(16)) {
    if (!isFormData(form)) {
      throw new TypeError("Expected first argument to be a FormData instance.")
    }

    if (typeof boundary !== "string") {
      throw new TypeError("Expected boundary to be a string.")
    }

    this.boundary = `form-data-boundary-${boundary}`
    this.contentType = `multipart/form-data; boundary=${this.boundary}`

    this.#encoder = new TextEncoder()

    this.#CRLF = "\r\n"
    this.#CRLF_BYTES = this.#encoder.encode(this.#CRLF)
    this.#CRLF_BYTES_LENGTH = this.#CRLF_BYTES.byteLength

    this.#form = form
    this.#footer = this.#encoder.encode(
      `${this.#DASHES}${this.boundary}${this.#DASHES}${this.#CRLF.repeat(2)}`
    )

    this.headers = Object.freeze({
      "Content-Type": this.contentType,
      "Content-Length": this.getContentLength()
    })
  }

  #getFieldHeader(name: string, value: unknown): Uint8Array {
    let header = ""

    header += `${this.#DASHES}${this.boundary}${this.#CRLF}`
    header += `Content-Disposition: form-data; name="${escape(name)}"`

    if (isFile(value)) {
      header += `; filename="${escape(value.name)}"${this.#CRLF}`
      header += `Content-Type: ${value.type || "application/octet-stream"}`
    }

    return this.#encoder.encode(`${header}${this.#CRLF.repeat(2)}`)
  }

  /**
   * Returns form-data content length
   */
  getContentLength(): number {
    let length = 0

    for (const [name, value] of this.#form) {
      length += this.#getFieldHeader(name, value).byteLength

      length += isFile(value)
        ? value.size
        : this.#encoder.encode(String(value)).byteLength

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
   * import {Encoder} from "form-data-encoder"
   *
   * import {FormData} from "formdata-polyfill/esm-min.js"
   * import {fileFrom} from "fetch-blob/form.js"
   * import {File} from "fetch-blob/file.js"
   * import {Blob} from "fetch-blob"
   *
   * import fetch from "node-fetch"
   *
   * const fd = new FormData()
   *
   * fd.set("field", "Just a random string")
   * fd.set("file", new File(["Using files is class amazing"]))
   * fd.set("fileFromPath", await fileFrom("path/to/a/file.txt"))
   *
   * const encoder = new Encoder(fd)
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
    for (const [name, value] of this.#form.entries()) {
      yield this.#getFieldHeader(name, value)

      yield isFile(value) ? value : this.#encoder.encode(String(value))

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
   * import {Encoder} from "form-data-encoder"
   *
   * import fetch from "node-fetch"
   *
   * const fd = new FormData()
   *
   * fd.set("field", "Just a random string")
   * fd.set("file", new File(["Using files is class amazing"]))
   * fd.set("fileFromPath", await fileFromPath("path/to/a/file.txt"))
   *
   * const encoder = new Encoder(fd)
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
