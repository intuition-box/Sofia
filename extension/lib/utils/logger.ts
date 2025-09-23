/**
 * Professional logging utility
 * Replaces console.log calls with proper logging that can be disabled in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  enableDebug: boolean
  enableInfo: boolean
  prefix: string
}

class Logger {
  private config: LoggerConfig

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enableDebug: process.env.NODE_ENV === 'development',
      enableInfo: true,
      prefix: '🔧 SOFIA',
      ...config
    }
  }

  private formatMessage(level: LogLevel, message: string, data?: any): [string, ...any[]] {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    const emoji = this.getLevelEmoji(level)
    const formattedMessage = `${emoji} [${timestamp}] ${this.config.prefix} - ${message}`
    
    return data !== undefined ? [formattedMessage, data] : [formattedMessage]
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case 'debug': return '🔍'
      case 'info': return '📊'
      case 'warn': return '⚠️'
      case 'error': return '❌'
      default: return '📝'
    }
  }

  debug(message: string, data?: any): void {
    if (this.config.enableDebug) {
      console.log(...this.formatMessage('debug', message, data))
    }
  }

  info(message: string, data?: any): void {
    if (this.config.enableInfo) {
      console.info(...this.formatMessage('info', message, data))
    }
  }

  warn(message: string, data?: any): void {
    console.warn(...this.formatMessage('warn', message, data))
  }

  error(message: string, error?: any): void {
    console.error(...this.formatMessage('error', message, error))
  }

  // Specialized loggers for different modules
  blockchain(message: string, data?: any): void {
    this.debug(`[Blockchain] ${message}`, data)
  }

  api(message: string, data?: any): void {
    this.debug(`[API] ${message}`, data)
  }

  storage(message: string, data?: any): void {
    this.debug(`[Storage] ${message}`, data)
  }

  hook(hookName: string, message: string, data?: any): void {
    this.debug(`[${hookName}] ${message}`, data)
  }
}

// Default logger instance
export const logger = new Logger()

// Specialized loggers
export const blockchainLogger = new Logger({ prefix: '⛓️ Blockchain' })
export const apiLogger = new Logger({ prefix: '🌐 API' })
export const storageLogger = new Logger({ prefix: '💾 Storage' })

// Hook-specific logger factory
export const createHookLogger = (hookName: string) => 
  new Logger({ prefix: `🪝 ${hookName}` })

export default logger