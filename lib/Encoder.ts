import createBoundary from "./util/createBoundary"
import getMime from "./util/getMimeFromFilename"
import isFormData from "./util/isFormData"
import isFile from "./util/isFile"

import {FormDataLike} from "./FormDataLike"

const DASHES = "-".repeat(2)
const CRLF = "\r\n"
const CRLF_BYTES = new TextEncoder().encode(CRLF)
const CRLF_BYTES_LENGTH = CRLF_BYTES.byteLength

export class Encoder {
  /**
   * Returns a boundary string
   */
  readonly boundary: string

  /**
   * Returns Content-Type header for multipart/form-data
   */
  readonly contentType: string

  /**
   * Returns field's footer
   */
  readonly #footer: Uint8Array

  /**
   * FormData instance
   */
  readonly #form: FormDataLike

  constructor(form: FormDataLike, boundary: string = createBoundary()) {
    if (!isFormData(form)) {
      throw new TypeError("Expected first argument to be a FormData instance.")
    }

    if (typeof boundary !== "string") {
      throw new TypeError("Expected boundary to be a string.")
    }

    this.boundary = boundary
    this.contentType = `multipart/form-data; boundary=${this.boundary}`

    this.#form = form
    this.#footer = new TextEncoder()
      .encode(`${DASHES}${this.boundary}${DASHES}${CRLF.repeat(2)}`)
  }

  /**
   * Returns headers for multipart/form-data
   */
  get headers() {
    return {
      "Content-Type": this.contentType,
      "Content-Length": this.getContentLength()
    }
  }

  private _getFieldHeader(name: string, value: unknown): Uint8Array {
    let header = ""

    header += `${DASHES}${this.boundary}${CRLF}`
    header += `Content-Disposition: form-data; name="${name}"`

    if (isFile(value)) {
      header += `; filename="${value.name}"${CRLF}`
      header += `Content-Type: ${value.type || getMime(value.name)}`
    }

    return new TextEncoder().encode(`${header}${CRLF.repeat(2)}`)
  }

  /**
   * Returns form-data content length
   */
  getContentLength(): number {
    let length = 0

    for (const [name, value] of this.#form) {
      length += this._getFieldHeader(name, value).byteLength

      length += isFile(value)
        ? value.size
        : new TextEncoder().encode(String(value)).byteLength

      length += CRLF_BYTES_LENGTH
    }

    return length + this.#footer.byteLength
  }

  async* encode(): AsyncGenerator<Uint8Array, void, undefined> {
    for (const [name, value] of this.#form) {
      yield this._getFieldHeader(name, value)

      if (isFile(value)) {
        yield* value.stream()
      } else {
        yield new TextEncoder().encode(String(value))
      }

      yield CRLF_BYTES
    }

    yield this.#footer
  }

  [Symbol.asyncIterator]() {
    return this.encode()
  }
}
