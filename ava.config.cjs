module.exports = {
  extensions: ["ts"],
  environmentVariables: {
    TS_NODE_COMPILER: "ttypescript",
    TS_NODE_PROJECT: "tsconfig.cjs.json"
  },
  require: ["ts-node/register/transpile-only"],
  files: ["lib/**/*.test.ts"]
}
