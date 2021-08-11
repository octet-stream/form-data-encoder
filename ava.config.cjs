module.exports = {
  extensions: [
    "ts"
  ],
  environmentVariables: {
    TS_NODE_PROJECT: "tsconfig.ava.json"
  },
  require: [
    "ts-node/register"
  ],
  files: [
    "lib/**/*.test.ts"
  ]
}
