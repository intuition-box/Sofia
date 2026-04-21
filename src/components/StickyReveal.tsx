import React from 'react';

interface StickyRevealProps {
  children: React.ReactNode;
  className?: string;
}

export function StickyReveal({
  children,
  className = ''
}: StickyRevealProps) {
  return (
    <div className={`sticky-section ${className}`}>
      <div className="sticky-content">
        {children}
      </div>
    </div>
  );
}