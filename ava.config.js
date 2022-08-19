export default {
  environmentVariables: {
    TS_NODE_PREFER_TS_EXTS: "true"
  },
  extensions: {
    ts: "module"
  },
  nodeArguments: [
    "--no-warnings",
    "--loader=ts-node/esm/transpile-only"
  ],
  files: [
    "src/**/*.test.ts"
  ]
}
