import { useState, useEffect } from 'react'
import { SEASON_END } from '../config'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'

function getTimeLeft() {
  const diff = SEASON_END.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

export default function Hero() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft)

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Card>
      <CardContent className="flex flex-col items-center py-8 text-center">
        <div className="flex items-baseline gap-1 font-display text-4xl tracking-tight">
          <span>{timeLeft.days}d</span>
          <span>{pad(timeLeft.hours)}h</span>
          <span>{pad(timeLeft.minutes)}m</span>
          <span>{pad(timeLeft.seconds)}s</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">remaining — Alpha Reward Program is live</p>
        <p className="text-sm text-muted-foreground mt-3">
          The top spots are being claimed right now.
        </p>
        <Button className="mt-4" size="sm">
          Install Sofia
        </Button>
      </CardContent>
    </Card>
  )
}
