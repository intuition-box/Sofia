import React from 'react';

interface DocCardProps {
  title: string;
  description: string;
  href?: string;
  icon?: string;
  accent?: string;
}

export default function DocCard({ title, description, href, icon, accent }: DocCardProps) {
  const card = (
    <div
      className="doc-card"
      style={{
        background: 'var(--sofia-bg-alt)',
        border: '1px solid var(--sofia-border)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        transition: 'all 0.25s ease',
        cursor: href ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        minHeight: '120px',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={href ? (e) => {
        e.currentTarget.style.background = 'var(--sofia-bg-elevated)';
        e.currentTarget.style.borderColor = 'var(--sofia-border-hover)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      } : undefined}
      onMouseLeave={href ? (e) => {
        e.currentTarget.style.background = 'var(--sofia-bg-alt)';
        e.currentTarget.style.borderColor = 'var(--sofia-border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      } : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {icon && <span style={{ fontSize: '1.3rem' }}>{icon}</span>}
        <strong
          style={{
            fontFamily: "var(--font-body)",
            fontSize: '1.05rem',
            color: accent || 'var(--sofia-green-vif)',
          }}
        >
          {title}
        </strong>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: '0.88rem',
          color: 'var(--sofia-text-muted)',
          lineHeight: 1.5,
          fontFamily: "var(--font-body)",
        }}
      >
        {description}
      </p>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="doc-card-link" style={{ textDecoration: 'none', color: 'inherit', border: 'none' }}>
        {card}
      </a>
    );
  }

  return card;
}
