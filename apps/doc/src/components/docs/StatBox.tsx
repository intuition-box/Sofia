import React from 'react'

interface StatBoxProps {
  value: string
  label: string
}

export default function StatBox({ value, label }: StatBoxProps) {
  return (
    <div className="stat-box">
      <div className="stat-box-value">{value}</div>
      <div className="stat-box-label">{label}</div>
    </div>
  )
}
