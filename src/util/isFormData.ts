import isFunction from "./isFunction.js"

import {FormDataLike} from "../FormDataLike.js"

/**
 * Check if given object is FormData
 *
 * @param value an object to test
 */
export const isFormData = (value?: unknown): value is FormDataLike => Boolean(
  (value as FormDataLike)
    && isFunction((value as FormDataLike).constructor)
    && (value as FormDataLike)[Symbol.toStringTag] === "FormData"
    && isFunction((value as FormDataLike).append)
    && isFunction((value as FormDataLike).getAll)
    && isFunction((value as FormDataLike).entries)
    && isFunction((value as FormDataLike)[Symbol.iterator])
)

/**
 * Check if given object is FormData
 *
 * @param value an object to test
 *
 * @deprecated use `isFormData` instead.
 */
export const isFormDataLike = isFormData
