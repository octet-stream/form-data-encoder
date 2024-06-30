export default {
  failFast: true,
  nodeArguments: ["--no-warnings", "--import=tsimp"],
  extensions: {
    ts: "module"
  },
  files: ["src/**/*.test.ts"]
}
