export default {
  environmentVariables: {
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
