import { Card } from '../ui/card'

export function ActivityCardSkeleton() {
  return (
    <Card className="sk-card">
      <div className="sk-row">
        <div className="sk-box sk-favicon" />
        <div className="sk-line sk-w60" />
        <div className="sk-line sk-w20 sk-ml-auto" />
      </div>
      <div className="sk-row">
        <div className="sk-pill" />
        <div className="sk-pill" />
      </div>
      <div className="sk-line sk-w40" />
      <div className="sk-row">
        <div className="sk-btn" />
        <div className="sk-box sk-share" />
      </div>
    </Card>
  )
}

export function TopClaimSkeleton() {
  return (
    <Card className="sk-card sk-claim">
      <div className="sk-row">
        <div className="sk-box sk-favicon" />
        <div className="sk-line sk-w50" />
      </div>
      <div className="sk-row">
        <div className="sk-pill" />
        <div className="sk-line sk-w20" />
        <div className="sk-line sk-w20" />
      </div>
      <div className="sk-row">
        <div className="sk-btn" />
        <div className="sk-box sk-share" />
      </div>
    </Card>
  )
}

export function InterestCardSkeleton() {
  return (
    <Card className="sk-card sk-interest">
      <div className="sk-row">
        <div className="sk-box sk-icon" />
        <div className="sk-col">
          <div className="sk-line sk-w60" />
          <div className="sk-line sk-w30" />
        </div>
      </div>
      <div className="sk-divider" />
      <div className="sk-row">
        <div className="sk-line sk-w20 sk-big" />
        <div className="sk-line sk-w20" />
      </div>
    </Card>
  )
}
