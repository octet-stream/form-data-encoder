import test from "ava"

import {proxyHeaders} from "./proxyHeaders.js"

test("Properties can be accessed by their original name", t => {
  const object = proxyHeaders({"Content-Type": "application/json"})

  t.is(object["Content-Type"], "application/json")
})

test("Properties can be accessed by lowercased name", t => {
  const object = proxyHeaders({"Content-Type": "application/json"})

  t.is(object["content-type"], "application/json")
})

test("Has no affect on symbols", t => {
  const name = Symbol("something")

  const object = proxyHeaders({[name]: "value"})

  t.is(object[name], "value")
})

test("Returns indefined if property doesn't exists", t => {
  const object = proxyHeaders({FOO: "foo"})

  t.is(object.FOO, "foo")
  t.is(object.foo, "foo")

  // @ts-expect-error This property is not defined on purpose
  t.is(object.bar, undefined)
})

test("Lowercases properties can be recognized by the in operator", t => {
  const object = proxyHeaders({"Content-Length": "42"})

  t.true("content-length" in object)
})

test("Original property name can be recognized by the in operator", t => {
  const object = proxyHeaders({"Content-Length": "451"})

  t.true("Content-Length" in object)
})

test("The in operator will return false for non-existent properties", t => {
  const object: Record<string, string> = proxyHeaders({FOO: "foo"})

  t.false("bar" in object)
})
