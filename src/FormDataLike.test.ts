import test from "ava"

import {expectType} from "ts-expect"
import {FormData as FormDataNode} from "formdata-node"
import {FormData as NodeFetchFormData} from "node-fetch"
import {FormData as UndiciFormData} from "undici"

import type {FormDataLike} from "./FormDataLike.js"

test("FormData is assignable to FormDataLike", t => {
  expectType<FormDataLike>(new FormData())

  t.pass()
})

test("FormData from formdata-node is assignable to FormDataLike", t => {
  expectType<FormDataLike>(new FormDataNode())

  t.pass()
})

test("FormData from undici is assignable to FormDataLike", t => {
  expectType<FormDataLike>(new UndiciFormData())

  t.pass()
})

test("FormData from node-fetch is assignable to FormDataLike", t => {
  expectType<FormDataLike>(new NodeFetchFormData())

  t.pass()
})
