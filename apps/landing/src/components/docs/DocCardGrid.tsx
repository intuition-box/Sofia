import React from 'react';

interface DocCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export default function DocCardGrid({ children, columns = 2 }: DocCardGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '1rem',
        margin: '1.5rem 0',
      }}
    >
      {children}

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
