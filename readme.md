# form-data-encoder

Encode `FormData` content into the `multipart/form-data` format

# Usage

```js
import {Readable} from "stream"

import {Encoder} from "form-data-encoder"
import {FormData} from "formdata-node"

import fetch from "node-fetch"

const fd = new FormData()

fd.set("greeting", "Hello, World!")

const encoder = new Encoder(fd)

const options = {
  method: "post",

  // Set request headers provided the Encoder.
  // The `headers` property has `Content-Type` and `Content-Length` headers.
  headers: encoder.headers,

  // Create a Readable stream from the Encoder.
  // The Encoder will yield FormData content portions encoded into the multipart/form-data format as node-fetch consumes the stream.
  body: Readable.from(encoder)
}

const response = await fetch("https://httpbin.org/post", options)

console.log(await response.json())
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
