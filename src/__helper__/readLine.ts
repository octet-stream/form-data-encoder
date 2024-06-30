import {createInterface} from "node:readline"
import type {Readable} from "node:stream"

async function* readLine(readable: Readable) {
  yield* createInterface(readable)
}

export default readLine
