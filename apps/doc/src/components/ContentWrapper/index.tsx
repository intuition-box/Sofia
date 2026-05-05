import React from 'react';
import './ContentWrapper.css';

interface ContentWrapperProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  wide?: boolean;
}

export default function ContentWrapper({
  children,
  className = '',
  style = {},
  wide = false,
}: ContentWrapperProps): React.ReactElement {
  const classes = ['content-wrapper', wide && 'content-wrapper--wide', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}
