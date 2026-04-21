import React from 'react';
import './ContentWrapperWide.css';

interface ContentWrapperWideProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ContentWrapperWide component for wider text content (Manifesto, Light Paper)
 * Similar to ContentWrapper but with a narrower max-width for better readability
 */
export default function ContentWrapperWide({
  children,
  className = '',
  style = {}
}: ContentWrapperWideProps): JSX.Element {
  return (
    <div className={`content-wrapper-wide ${className}`} style={style}>
      {children}
    </div>
  );
}
