export const MAX_CHUNK_SIZE = 65536

/**
 * Chunks given `value` into evenly sized pieces (Same as `MAX_CHUNK_SIZE` bytes per each).
 * Returns `Generator<Uint8Array>` allowing to iterate over these chunks.
 *
 * If value is less then `MAX_CHUNK_SIZE`, it will be returned as-is.
 *
 * If the last chunk is less than `MAX_CHUNK_SIZE`, then returned value will be the size that chunk.
 *
 * @param value A value to chunk into evenly sized pieces
 *
 * @api private
 */
export function* chunk(value: Uint8Array): Generator<Uint8Array, void> {
  if (value.byteLength <= MAX_CHUNK_SIZE) {
    yield value

    return
  }

  let offset = 0
  while (offset < value.byteLength) {
    const size = Math.min(value.byteLength - offset, MAX_CHUNK_SIZE)
    const buffer = value.buffer.slice(offset, offset + size)

    offset += buffer.byteLength

    yield new Uint8Array(buffer)
  }
}
