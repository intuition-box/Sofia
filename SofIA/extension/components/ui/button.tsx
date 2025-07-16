import React from "react"

interface ButtonProps {
  variant?: "default" | "successOutline"
  onClick?: () => void
  children: any
  style?: any
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = "default", 
  onClick, 
  children, 
  style = {} 
}) => {
  const baseStyles = {
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    ...style
  }
  
  const variants = {
    default: {
      backgroundColor: '#007bff',
      color: 'white'
    },
    successOutline: {
      backgroundColor: 'transparent',
      border: '2px solid #28a745',
      color: '#28a745'
    }
  }

  const [isHovered, setIsHovered] = React.useState(false)

  const buttonStyle = {
    ...baseStyles,
    ...variants[variant],
    ...(isHovered && variant === 'default' && { backgroundColor: '#0056b3' }),
    ...(isHovered && variant === 'successOutline' && { backgroundColor: '#28a745', color: 'white' })
  }

  return (
    <button
      onClick={onClick}
      style={buttonStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  )
}