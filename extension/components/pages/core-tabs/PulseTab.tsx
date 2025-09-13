import { useState, useEffect } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import '../../styles/CorePage.css'

interface PulseTabProps {
  expandedTriplet: { msgIndex: number; tripletIndex: number } | null
  setExpandedTriplet: (value: { msgIndex: number; tripletIndex: number } | null) => void
}

const PulseTab = ({ expandedTriplet, setExpandedTriplet }: PulseTabProps) => {
  const [address] = useStorage<string>("metamask-account")
  
  return (
    <div className="triples-container">
      <div className="empty-state">
        <p>Pulse Tab</p>
        <p className="empty-subtext">
          Your pulse data will appear here
        </p>
      </div>
    </div>
  )
}

export default PulseTab