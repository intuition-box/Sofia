import React from 'react'
import OriginalLayoutProvider from '@theme-original/Layout/Provider'

export default function LayoutProvider({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return <OriginalLayoutProvider>{children}</OriginalLayoutProvider>
}
