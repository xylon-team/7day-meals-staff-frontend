const personNamePattern = /^\p{L}[\p{L}\p{M}]*(?:(?:['’\-][\p{L}\p{M}]+)|(?: +[\p{L}\p{M}]+))*$/u

export const isValidPersonName = (value: string): boolean => {
  const name = value.trim()
  return name.length > 0 && personNamePattern.test(name)
}
