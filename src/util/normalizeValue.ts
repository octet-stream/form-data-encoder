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
  .replace(/\r|\n/g, (match: string, i: number, str: string) => {
    if (
      (match === "\r" && str[i + 1] !== "\n")
        || (match === "\n" && str[i - 1] !== "\r")
    ) {
      return "\r\n"
    }

    return match
  })
