import test from "ava"

import {expectType} from "ts-expect"
import {File as FormDataNodeFile} from "formdata-node"
import {File as NodeFetchFile} from "node-fetch"
import {File as UndiciFile} from "undici"

import type {FileLike} from "./FileLike.js"

test("File is assignable to FileLike", t => {
  expectType<FileLike>(new File([], "test.txt"))

  t.pass()
})

test("File from formdata-node is assignable to FileLike", t => {
  expectType<FileLike>(new FormDataNodeFile([], "test.txt"))

  t.pass()
})

test("File from undici is assignable to FileLike", t => {
  expectType<FileLike>(new UndiciFile([], "test.txt"))

  t.pass()
})

test("File from node-fetch is assignable to FileLike", t => {
  expectType<FileLike>(new NodeFetchFile([], "test.txt"))

  t.pass()
})
