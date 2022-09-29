import type {FormDataEncoderHeaders, RawHeaders} from "./Headers.js"

function getProperty(
  target: RawHeaders,
  prop: string | symbol
): string | undefined {
  if (typeof prop === "string") {
    for (const [name, value] of Object.entries(target)) {
      if (prop.toLowerCase() === name.toLowerCase()) {
        return value
      }
    }
  }

  return undefined
}

export const proxyHeaders = (object: RawHeaders) => new Proxy(
  object,

  {
    get: (target, prop) => getProperty(target, prop),

    has: (target, prop) => getProperty(target, prop) !== undefined
  }
) as unknown as FormDataEncoderHeaders
