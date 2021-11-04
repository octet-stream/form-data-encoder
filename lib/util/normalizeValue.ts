/**
 * Normalize non-File value following the spec requirements.
 *
 * See: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#multipart-form-data
 *
 * @param value A value to normalize
 *
 * @api private
 */
const normalizeValue = (value: unknown): string => String(value)
  .replace(/\r(?!\n)|(?<!\r)\n/g, "\r\n")

export default normalizeValue
