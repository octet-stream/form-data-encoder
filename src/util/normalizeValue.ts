/**
 * Normalize non-File value following the spec requirements.
 *
 * See: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#multipart-form-data
 *
 * @param value A value to normalize
 *
 * @api private
 */
export const normalizeValue = (value: unknown): string => String(value)
  // TODO: Revert this to /\r(?!\n)|(?<!\r)\n/g when all browsers will support lookbehind in RegExp. See: https://github.com/octet-stream/form-data-encoder/issues/5
  .replace(/\r|\n/g, (match: string, i: number, str: string) => {
    if (
      (match === "\r" && str[i + 1] !== "\n")
        || (match === "\n" && str[i - 1] !== "\r")
    ) {
      return "\r\n"
    }

    return match
  })
