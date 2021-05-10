async function streamToString(
  input: {[Symbol.asyncIterator](): AsyncIterableIterator<any>}
) {
  let string = ""

  const decoder = new TextDecoder()

  for await (const chunk of input) {
    string += decoder.decode(chunk, {stream: true})
  }

  string += decoder.decode()

  return string
}

export default streamToString
