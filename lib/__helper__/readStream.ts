import {Readable} from "stream"

import {ReadableStream} from "web-streams-polyfill/ponyfill/es2018"

type Input = Readable | ReadableStream | {
  [Symbol.asyncIterator](): AsyncIterableIterator<any>
}

async function readToBuffer(input: Input): Promise<Buffer> {
  const chunks = []

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
async function readStream(
  input: Input,

  toString: boolean
): Promise<string>
async function readStream(
  input: Input,

  toString: boolean = false
): Promise<string | Buffer> {
  return toString ? readToString(input) : readToBuffer(input)
}

export default readStream
