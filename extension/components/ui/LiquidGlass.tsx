import React from 'react'
import '../styles/LiquidGlass.css'

interface LiquidGlassProps {
  className?: string
  height?: string
}

const LiquidGlass: React.FC<LiquidGlassProps> = ({ 
  className = '', 
  height = '2px' 
}) => {
  return (
    <div className={`liquid-glass ${className}`} style={{ height }}>
      <div className="liquid-glass-inner">
        <div className="liquid-glass-wave wave1"></div>
        <div className="liquid-glass-wave wave2"></div>
        <div className="liquid-glass-wave wave3"></div>
      </div>
    </div>
  )
}

export default LiquidGlass