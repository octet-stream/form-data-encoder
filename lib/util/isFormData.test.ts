import test from "ava"

import {FormData} from "formdata-node"

import isFormData from "./isFormData"

test("Returns true for spec-compatible FormData instance", t => {
  t.true(isFormData(new FormData()))
})

test("Returns false for null", t => {
  t.false(isFormData(null))
})

test("Returns false for undefined", t => {
  t.false(isFormData(undefined))
})

test("Returns false for non-FormData object", t => {
  t.false(isFormData(new Map()))
})
