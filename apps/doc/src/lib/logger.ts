const isDev = process.env.NODE_ENV !== 'production'

type LogFn = (...args: unknown[]) => void

interface Logger {
  log: LogFn
  warn: LogFn
  error: LogFn
}

const noop: LogFn = () => {}

export const logger: Logger = {
  log: isDev ? (...args) => console.log(...args) : noop,
  warn: isDev ? (...args) => console.warn(...args) : noop,
  error: isDev ? (...args) => console.error(...args) : noop,
}
