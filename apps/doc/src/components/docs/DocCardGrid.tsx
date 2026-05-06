import React from 'react'

interface DocCardGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
}

export default function DocCardGrid({
  children,
  columns = 2,
}: DocCardGridProps) {
  return (
    <div
      className="doc-card-grid"
      style={{ ['--doc-card-cols' as string]: columns }}
    >
      {children}
    </div>
  )
}
