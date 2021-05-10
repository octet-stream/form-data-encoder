import {createInterface} from "readline"
import {Readable} from "stream"

async function* readLine(readable: Readable) {
  yield* createInterface(readable)
}

export default readLine
