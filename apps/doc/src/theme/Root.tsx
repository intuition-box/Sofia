import React from 'react'

// Doc no longer wraps its tree with a wallet provider — auth flows
// redirect to the Explorer SPA. This Root stays as a simple pass-through
// so the Docusaurus theme picks up custom layout if we add anything
// later.
export default function Root({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
