/**
 * Error boundary around the main <Routes> so a render-phase crash in
 * any page shows an actionable error instead of a black screen.
 *
 * The overlay prints the error message + stack. In production the stack
 * is minified, so we also log the React component stack, which is often
 * more useful than the JS stack for pinpointing which hook/component
 * blew up.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
  componentStack: string | null
}

export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[RouteErrorBoundary]', error)
    console.error('[RouteErrorBoundary] componentStack:', info.componentStack)
    this.setState({ componentStack: info.componentStack ?? null })
  }

  handleReset = () => {
    this.setState({ error: null, componentStack: null })
  }

  handleClearCacheAndReload = () => {
    try {
      localStorage.removeItem('sofia-rq-cache')
    } catch { /* noop */ }
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{
        padding: 24,
        maxWidth: 960,
        margin: '40px auto',
        color: '#f4f4f4',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 13,
      }}>
        <h2 style={{ color: '#ff6b6b', fontSize: 18, margin: 0 }}>
          Something crashed while rendering this view.
        </h2>
        <p style={{ color: '#aaa', marginTop: 8 }}>
          {this.state.error.message}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            onClick={this.handleReset}
            style={{ padding: '6px 12px', background: '#333', color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer' }}
          >
            Retry
          </button>
          <button
            onClick={this.handleClearCacheAndReload}
            style={{ padding: '6px 12px', background: '#f0b36e', color: '#000', border: 0, borderRadius: 4, cursor: 'pointer' }}
          >
            Clear cache and reload
          </button>
        </div>
        <details style={{ marginTop: 16, background: '#1a1a1a', padding: 12, borderRadius: 4 }}>
          <summary style={{ cursor: 'pointer', color: '#888' }}>Stack</summary>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error.stack}
          </pre>
        </details>
        {this.state.componentStack && (
          <details style={{ marginTop: 8, background: '#1a1a1a', padding: 12, borderRadius: 4 }}>
            <summary style={{ cursor: 'pointer', color: '#888' }}>Component stack</summary>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.componentStack}
            </pre>
          </details>
        )}
      </div>
    )
  }
}
