/* eslint-disable import/no-extraneous-dependencies */

import {defineConfig} from "tsup"

export default defineConfig(() => ({
  entry: ["src/index.ts"],
  outDir: "lib",
  format: ["esm", "cjs"],
  dts: true,
  splitting: false
}))
