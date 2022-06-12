import type {LowercaseObjectKeys} from "./LowercaseObjectKeys.js"

type AnyObject = Record<string | symbol, string>

function getProperty<
  T extends AnyObject
>(target: T, prop: string | symbol): string | undefined {
  if (typeof prop !== "string") {
    return target[prop]
  }

  for (const [name, value] of Object.entries(target)) {
    if (prop.toLowerCase() === name.toLowerCase()) {
      return value
    }
  }

  return undefined
}

export const proxyHeaders = <T extends AnyObject>(object: T) => new Proxy(
  object,

  {
    get: (target, prop) => getProperty(target, prop),

    has: (target, prop) => getProperty(target, prop) !== undefined
  }
) as T & LowercaseObjectKeys<T>
