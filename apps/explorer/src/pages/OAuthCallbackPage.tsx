import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (window.opener) {
      window.opener.postMessage(
        { type: 'oauth_callback', code, state, error },
        window.location.origin
      )
    }
  }, [searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Connecting... you can close this window.</p>
    </div>
  )
}
