import createBoundary from "./util/createBoundary"
import isFormData from "./util/isFormData"
import isFile from "./util/isFile"

import {FormDataLike} from "./FormDataLike"

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

  readonly #encoder: TextEncoder

  /**
   * Returns field's footer
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
  constructor(form: FormDataLike, boundary: string = createBoundary()) {
    if (!isFormData(form)) {
      throw new TypeError("Expected first argument to be a FormData instance.")
    }

    if (typeof boundary !== "string") {
      throw new TypeError("Expected boundary to be a string.")
    }

    this.boundary = boundary
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
    header += `Content-Disposition: form-data; name="${name}"`

    if (isFile(value)) {
      header += `; filename="${value.name}"${this.#CRLF}`
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
   * Creates an async iterator allowing to perform the encoding by portions.
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
    for (const [name, value] of this.#form) {
      yield this.#getFieldHeader(name, value)

      if (isFile(value)) {
        yield* value.stream()
      } else {
        yield this.#encoder.encode(String(value))
      }

      yield this.#CRLF_BYTES
    }

    yield this.#footer
  }

  [Symbol.asyncIterator]() {
    return this.encode()
  }
}
