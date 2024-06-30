import type {Readable} from "node:stream"

type Input =
  | Readable
  | {
      // biome-ignore lint/suspicious/noExplicitAny: Intended use of any
      [Symbol.asyncIterator](): AsyncIterableIterator<any>
    }

async function readToBuffer(input: Input): Promise<Buffer> {
  const chunks: Buffer[] = []

  for await (const chunk of input) {
    chunks.push(chunk)
  }

  return Buffer.concat(chunks)
}

async function readToString(input: Input): Promise<string> {
  let string = ""

  const decoder = new TextDecoder()

  for await (const chunk of input) {
    string += decoder.decode(chunk, {stream: true})
  }

  string += decoder.decode()

  return string
}

async function readStream(input: Input): Promise<Buffer>
async function readStream(input: Input, stringify: boolean): Promise<string>
async function readStream(
  input: Input,
  stringify = false
): Promise<string | Buffer> {
  return stringify ? readToString(input) : readToBuffer(input)
}

export default readStream
