/**
 * Centralized structured logger for the MCP server.
 *
 * Wraps Pino with a console-compatible signature (variadic args) so existing
 * call sites can migrate via simple search-and-replace without losing the
 * structured output. Direct Pino-style calls (`logger.info({ key }, "msg")`)
 * are also supported and preferred for new code.
 *
 * In production, set LOG_LEVEL=info|warn|error to control verbosity. In
 * development, set NODE_ENV=development for pretty-printed output.
 */
import { pino, type Level } from 'pino'
import { pinoHttp } from 'pino-http'
import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

const isDev = process.env.NODE_ENV !== 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  base: { service: 'mcp-server' },
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' },
    },
  }),
})

/**
 * Console-compatible facade so legacy `console.error('foo', err)` calls can
 * become `log.error('foo', err)` without restructuring every site at once.
 * Multi-arg calls are merged into a single message + payload.
 */
function pack(level: Level) {
  return (...args: unknown[]) => {
    if (args.length === 0) return
    if (args.length === 1) {
      const a = args[0]
      if (a instanceof Error) logger[level]({ err: a }, a.message)
      else if (typeof a === 'string') logger[level](a)
      else logger[level](a as object)
      return
    }
    const [first, ...rest] = args
    const msg = typeof first === 'string' ? first : JSON.stringify(first)
    logger[level]({ args: rest }, msg)
  }
}

export const log = {
  fatal: pack('fatal'),
  error: pack('error'),
  warn: pack('warn'),
  info: pack('info'),
  debug: pack('debug'),
  trace: pack('trace'),
}

/**
 * Express middleware: tags every request with a UUID and attaches a child
 * logger to req.log. Honours an upstream `x-request-id` header so logs can
 * be correlated across the proxy → mcp-server → upstream chain.
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req: IncomingMessage, res: ServerResponse) => {
    const incoming =
      (req.headers['x-request-id'] as string | undefined) ||
      (req.headers['cf-ray'] as string | undefined)
    const id = incoming ?? randomUUID()
    res.setHeader('x-request-id', id)
    return id
  },
  customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
    if (err || res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
  serializers: {
    req: (req: IncomingMessage) => ({ method: req.method, url: req.url }),
    res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
  },
})
