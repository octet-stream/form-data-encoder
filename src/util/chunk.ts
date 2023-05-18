export const MAX_CHUNK_SIZE = 65536

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
