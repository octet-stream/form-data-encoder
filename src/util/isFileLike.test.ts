import test from "ava"

import {File, Blob} from "formdata-node"

import {FileLike} from "../FileLike.js"

import {isFileLike} from "./isFileLike.js"

test("Returns true for a File", t => {
  const file = new File(["Content"], "name.txt")

  t.true(isFileLike(file))
})

test("Returns true for a class that implements File", t => {
  class MyFile implements FileLike {
    name = ""

    type = ""

    size = 0

    lastModified = Date.now()

    async* stream(): AsyncGenerator<Uint8Array> {
      yield new Uint8Array(0)
    }

    get [Symbol.toStringTag](): string {
      return "File"
    }
  }

  t.true(isFileLike(new MyFile()))
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

  t.true(isFileLike(object))
})

test("Returns false for null", t => {
  t.false(isFileLike(null))
})

test("Returns false for undefined", t => {
  t.false(isFileLike(undefined))
})

test("Returns false for non-File object", t => {
  t.false(isFileLike(new Map()))
})

test("Returns false for Blob", t => {
  const blob = new Blob(["Content"], {type: "text/plain"})

  t.false(isFileLike(blob))
})
