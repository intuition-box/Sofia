import React from 'react';

interface StatBoxProps {
  value: string;
  label: string;
  icon?: string;
}

export default function StatBox({ value, label, icon }: StatBoxProps) {
  return (
    <div
      className="stat-box"
      style={{
        background: 'var(--sofia-bg-alt)',
        border: '1px solid var(--sofia-border)',
        borderRadius: '12px',
        padding: '1.2rem',
        textAlign: 'center',
        fontFamily: "var(--font-body)",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {icon && <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{icon}</div>}
      <div
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--sofia-green-vif)',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '0.78rem',
          color: 'var(--sofia-text-muted)',
          marginTop: '0.35rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </div>
    </div>
  );
}
