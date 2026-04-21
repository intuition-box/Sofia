import './styles/page-header.css'

interface PageHeaderProps {
  color: string
  glow: string
  title: string
  subtitle?: string
}

export default function PageHeader({ color, glow, title, subtitle }: PageHeaderProps) {
  return (
    <div className="ph-container" style={{ background: color }}>
      <div className="ph-title">
        {title}
      </div>
      {subtitle && (
        <div className="ph-subtitle">
          {subtitle}
        </div>
      )}
      {/* Decorative square */}
      <div className="ph-deco" />
    </div>
  )
}
