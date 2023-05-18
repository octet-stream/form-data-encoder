export default {
  environmentVariables: {
    TS_NODE_PREFER_TS_EXTS: "true",
    SWC_NODE_PROJECT: "./tsconfig.ava.json",
    SWCRC: "true"
  },
  extensions: {
    ts: "module"
  },
  files: [
    "src/**/*.test.ts"
  ]
}
