# form-data-encoder

Encode `FormData` content into the `multipart/form-data` format

[![Code Coverage](https://codecov.io/github/octet-stream/form-data-encoder/coverage.svg?branch=master)](https://codecov.io/github/octet-stream/form-data-encoder?branch=master)
[![CI](https://github.com/octet-stream/form-data-encoder/workflows/CI/badge.svg)](https://github.com/octet-stream/form-data-encoder/actions/workflows/ci.yml)
[![ESLint](https://github.com/octet-stream/form-data-encoder/workflows/ESLint/badge.svg)](https://github.com/octet-stream/form-data-encoder/actions/workflows/eslint.yml)

## Usage

1. To start the encoding process, you need to create a new Encoder instance with the FormData you want to encode:

```js
import {Readable} from "stream"

import {FormData, File} from "formdata-node"
import {Encoder} from "form-data-encoder"

import fetch from "node-fetch"

const fd = new FormData()

fd.set("greeting", "Hello, World!")
fd.set("file", new File(["On Soviet Moon landscape see binoculars through YOU"], "file.txt"))

const encoder = new Encoder(fd)

const options = {
  method: "post",

  // Set request headers provided by the Encoder.
  // The `headers` property has `Content-Type` and `Content-Length` headers.
  headers: encoder.headers,

  // Create a Readable stream from the Encoder.
  // You can omit usage of `Readable.from` for HTTP clients whose support async iterables.
  // The Encoder will yield FormData content portions encoded into the multipart/form-data format as node-fetch consumes the stream.
  body: Readable.from(encoder.encode()) // or Readable.from(encoder)
}

const response = await fetch("https://httpbin.org/post", options)

console.log(await response.json())
```

2. Encoder support different spec-compatible FormData implementations. Let's try it with [`formdata-polyfill`](https://github.com/jimmywarting/FormData):

```js
import {Readable} from "stream"

import {Encoder} from "form-data-encoder"
import {FormData, File} from "formdata-polyfill/esm-min.js"

const fd = new FormData()

fd.set("field", "Some value")
fd.set("file", new File(["File content goes here"], "file.txt"))

const encoder = new Encoder(fd)

const options = {
  method: "post",
  headers: encoder.headers,
  body: Readable.from(encoder)
}

await fetch("https://httpbin.org/post", options)
```

3. Because the Encoder is async iterable, you can use it with different targets. Let's say you want to put FormData content into `Blob`, for that you can write a function like this:

```js
import {FormData} from "formdata-polyfill/esm-min.js"
import {blobFrom} from "fetch-blob/from.js"
import {Encoder} from "form-data-encoder"
import {Blob} from "fetch-blob" // For this example I will use v3 of this package

import fetch from "node-fetch"

async function toBlob(form) {
  const encoder = new Encoder(form)
  const chunks = []

  for await (const chunk of encoder) {
    chunks.push(chunk)
  }

  return new Blob(chunks, {type: encoder.contentType})
}

const fd = new FormData()

fd.set("name", "John Doe")
fd.set("avatar", await blobFrom("path/to/an/avatar.png"). "avatar.jpg")

const options = {
  method: "post",
  body: await toBlob(fd)
}

await fetch("https://httpbin.org/post", options)
```

4. In this example we will pull FormData content into the ReadableStream:

```js
 // This module is only necessary when you targeting Node.js or need web streams that implement Symbol.asyncIterator
import {ReadableStream} from "web-streams-api/ponyfill/es2018"

import {Encoder} from "form-data-encoder"
import {FormData} from "formdata-node"

import fetch from "node-fetch"

const toReadableStream = iterator => new ReadableStream({
  async pull(controller) {
    const {value, done} = await iterator.next()

    if (done) {
      return controller.close()
    }

    controller.enqueue(value)
  }
})

const fd = new FormData()

fd.set("field", "My hovercraft is full of eels")

const encoder = new Encoder(fd)

const options = {
  method: "post",
  headers: encoder.headers,
  body: toReadableStream(encoder.encode())
}

// Note that this example requires `fetch` to support Symbol.asyncIterator, which node-fetch lacks of (but will support eventually)
await fetch("https://httpbin.org/post", options)
```

5. Speaking of async iterables - if HTTP client supports them, you can use encoder like this:

```js
import {Encoder} from "form-data-encoder"
import {FormData} from "formdata-node"

import fetch from "node-fetch"

const fd = new FormData()

fd.set("field", "My hovercraft is full of eels")

const encoder = new Encoder(fd)

const options = {
  method: "post",
  headers: encoder.headers,
  body: encoder
}

await fetch("https://httpbin.org/post", options)
```

6. ...And for those client whose supporting form-data-encoder out of the box, the usage will be much, much more simpler:

```js
import {FormData} from "formdata-node" // Or any other spec-compatible implementation

import fetch from "node-fetch"

const fd = new FormData()

fd.set("field", "My hovercraft is full of eels")

const options = {
  method: "post",
  body: fd
}

// Note that node-fetch does NOT support form-data-encoder
await fetch("https://httpbin.org/post", options)
```

# Installation

You can install this package using npm:

```sh
npm install form-data-encoder
```

Or yarn:

```sh
yarn add form-data-encoder
```

Or pnpm:

```sh
pnpm add form-data-encoder
```

## API

### `class Encoder`

##### `constructor(form[, boundary]) -> {Encoder}`

  - **{FormDataLike}** form - FormData object to encode. This object must be a spec-compatible FormData implementation.
  - **{string}** boundary - An optional boundary string that will be used by the encoder. If there's no boundary string is present, Encoder will generate it automatically.

Creates a multipart/form-data encoder.

#### Instance properties

##### `boundary -> {string}`

Returns boundary string

##### `contentType -> {string}`

Returns Content-Type header for multipart/form-data

##### `headers -> {object}`

Returns headers object with Content-Type and Content-Length header

#### Instance methods

##### `encode() -> {AsyncGenerator<Uint8Array, void, undefined>}`

Creates an async iterator allowing to perform the encoding by portions.

##### `[Symbol.asyncIterator]() -> {AsyncGenerator<Uint8Array, void, undefined>}`

An alias for `Encoder#encode()` method.
