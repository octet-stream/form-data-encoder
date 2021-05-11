import createBoundary from "./util/createBoundary"
import getMime from "./util/getMimeFromFilename"
import isFormData from "./util/isFormData"
import isFile from "./util/isFile"

import {FormDataLike} from "./FormDataLike"

const DASHES = "-".repeat(2)
const CRLF = "\r\n"
const CRLF_BYTES_LENGTH = Buffer.byteLength(CRLF)

export class Encoder {
  readonly boundary: string

  readonly contentType: string

  /**
   * Returns field's footer
   */
  readonly #footer: string

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
    this.#footer = `${DASHES}${this.boundary}${DASHES}${CRLF.repeat(2)}`
  }

  get headers() {
    return {
      "Content-Type": this.contentType,
      "Content-Length": this.getContentLength()
    }
  }

  private _getFieldHeader(name: string, value: unknown) {
    let header = ""

    header += `${DASHES}${this.boundary}${CRLF}`
    header += `Content-Disposition: form-data; name="${name}"`

    if (isFile(value)) {
      header += `; filename="${value.name}"${CRLF}`
      header += `Content-Type: ${value.type || getMime(value.name)}`
    }

    return `${header}${CRLF.repeat(2)}`
  }

  getContentLength(): number {
    let length = 0

    for (const [name, value] of this.#form) {
      length += Buffer.byteLength(this._getFieldHeader(name, value))
      length += isFile(value) ? value.size : Buffer.byteLength(String(value))
      length += CRLF_BYTES_LENGTH
    }

    return length + Buffer.byteLength(this.#footer)
  }

  private async* _getField() {
    for (const [name, value] of this.#form) {
      yield this._getFieldHeader(name, value)

      if (isFile(value)) {
        yield* value.stream()
      } else {
        yield value
      }

      yield CRLF
    }

    yield this.#footer
  }

  async* encode(): AsyncGenerator<Buffer, void> {
    for await (const chunk of this._getField()) {
      yield Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))
    }
  }

  [Symbol.asyncIterator]() {
    return this.encode()
  }
}
