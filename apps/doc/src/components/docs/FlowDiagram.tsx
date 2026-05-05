import React from 'react';

interface FlowStep {
  label: string;
  icon?: string;
  description?: string;
}

interface FlowDiagramProps {
  steps: FlowStep[];
  direction?: 'horizontal' | 'vertical';
}

export default function FlowDiagram({ steps, direction = 'horizontal' }: FlowDiagramProps) {
  const isHorizontal = direction === 'horizontal';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        alignItems: 'center',
        gap: '0',
        margin: '2rem 0',
        overflowX: isHorizontal ? 'auto' : 'visible',
        padding: '0.5rem 0',
      }}
    >
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div
            style={{
              background: 'rgba(143, 184, 122, 0.08)',
              border: '1px solid rgba(143, 184, 122, 0.25)',
              borderRadius: '10px',
              padding: '0.8rem 1.2rem',
              textAlign: 'center',
              minWidth: isHorizontal ? '120px' : 'auto',
              flex: isHorizontal ? '0 0 auto' : undefined,
              fontFamily: "var(--font-body)",
            }}
          >
            {step.icon && (
              <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>
                {step.icon}
              </div>
            )}
            <div
              style={{
                fontWeight: 600,
                fontSize: '0.85rem',
                color: 'var(--sofia-text)',
              }}
            >
              {step.label}
            </div>
            {step.description && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--sofia-text-muted)',
                  marginTop: '0.25rem',
                }}
              >
                {step.description}
              </div>
            )}
          </div>

          {i < steps.length - 1 && (
            <div
              style={{
                color: 'var(--sofia-green-vif)',
                fontSize: '1.2rem',
                padding: isHorizontal ? '0 0.5rem' : '0.3rem 0',
                flexShrink: 0,
                fontFamily: 'monospace',
              }}
            >
              {isHorizontal ? '\u2192' : '\u2193'}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
