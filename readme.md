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

  // Set request headers provided the Encoder.
  // The `headers` property has `Content-Type` and `Content-Length` headers.
  headers: encoder.headers,

  // Create a Readable stream from the Encoder.
  // You can omit usage of `Readable.from` for HTTP clients whose support async iterables.
  // The Encoder will yield FormData content portions encoded into the multipart/form-data format as node-fetch consumes the stream.
  body: Readable.from(encoder)
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

#### `constructor(form[, boundary]) -> {Encoder}`

  - **{FormDataLike}** form - A FormData object to encode. This object must be a spec-compatible FormData implementation.
  - **{string}** boundary - An optional boundary string that will be used by the encoder. If there's no boundary string is present, Encoder will generate it automatically.

Creates a multipart/form-data encoder.

#### `encode() -> {AsyncGenerator<Buffer, void, undefined>}`

Creates an async iterator allowing to perform encoding process by portions.

#### `[Symbol.asyncIterator]() -> {AsyncGenerator<Buffer, void, undefined>}`

An alias for `Encoder#encode()` method.
