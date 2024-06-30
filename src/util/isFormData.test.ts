import test from "ava"

import {FormData} from "formdata-node"

import {isFormData} from "./isFormData.js"
import type {FormDataLike, FormDataEntryValue} from "../FormDataLike.js"

test("Returns true for spec-compatible FormData instance", t => {
  t.true(isFormData(new FormData()))
})

test("Returns true for a class that implements minimal FormData", t => {
  class MyFormData implements FormDataLike {
    append(): void {}

    getAll(): FormDataEntryValue[] {
      return []
    }

    *entries(): Generator<[string, FormDataEntryValue]> {
      yield ["name", "value"]
    }

    [Symbol.iterator]() {
      return this.entries()
    }

    get [Symbol.toStringTag](): string {
      return "FormData"
    }
  }

  t.true(isFormData(new MyFormData()))
})

test("Returns true for FormData-shaped object", t => {
  const object = {
    append(): void {},

    getAll(): FormDataEntryValue[] {
      return []
    },

    *entries(): Generator<[string, FormDataEntryValue]> {
      yield ["name", "value"]
    },

    [Symbol.iterator]() {
      return this.entries()
    },

    get [Symbol.toStringTag](): string {
      return "FormData"
    }
  }

  t.true(isFormData(object))
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
