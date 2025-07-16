import React from "react"

interface ButtonProps {
  variant?: "default" | "successOutline"
  onClick?: () => void
  children: React.ReactNode
  className?: string
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = "default", 
  onClick, 
  children, 
  className = "" 
}) => {
  const baseStyles = "px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
  
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    successOutline: "border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white focus:ring-green-500"
  }

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}