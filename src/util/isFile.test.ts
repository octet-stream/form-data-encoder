import test from "ava"

import {File, Blob} from "formdata-node"

import type {FileLike} from "../FileLike.js"
import {isFile} from "./isFile.js"

test("Returns true for a File", t => {
  const file = new File(["Content"], "name.txt")

  t.true(isFile(file))
})

test("Returns true for a class that implements File", t => {
  class MyFile implements FileLike {
    name = ""

    type = ""

    size = 0

    lastModified = Date.now()

    async* stream(): AsyncIterable<Uint8Array> {
      yield new Uint8Array(0)
    }

    get [Symbol.toStringTag](): string {
      return "File"
    }
  }

  t.true(isFile(new MyFile()))
})

test("Returns true for a file-shaped object", t => {
  const object = {
    name: "",

    type: "",

    size: 0,

    lastModified: Date.now(),

    async* stream(): AsyncGenerator<Uint8Array> {
      yield new Uint8Array(0)
    },

    get [Symbol.toStringTag](): string {
      return "File"
    }
  }

  t.true(isFile(object))
})

test("Returns false for null", t => {
  t.false(isFile(null))
})

test("Returns false for undefined", t => {
  t.false(isFile(undefined))
})

test("Returns false for non-File object", t => {
  t.false(isFile(new Map()))
})

test("Returns false for Blob", t => {
  const blob = new Blob(["Content"], {type: "text/plain"})

  t.false(isFile(blob))
})
