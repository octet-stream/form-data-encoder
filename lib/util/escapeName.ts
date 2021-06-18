const escapeName = (name: unknown) => String(name)
  .replace(/\r/g, "%0D") // CR
  .replace(/\n/g, "%0A") // LF
  .replace(/"/g, "%22")

export default escapeName
