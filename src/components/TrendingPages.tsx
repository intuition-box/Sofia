import { useTrending } from '../hooks/useTrending'
import type { IntentCategory } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import { TrendingUp } from 'lucide-react'
import './styles/trending.css'

const CATEGORY_LABELS: Record<IntentCategory, string> = {
  trusted: 'Trusted',
  distrusted: 'Distrusted',
  work: 'Work',
  learning: 'Learning',
  fun: 'Fun',
  inspiration: 'Inspiration',
  music: 'Music',
  buying: 'Buying',
}

export default function TrendingPages() {
  const { items, loading, error } = useTrending()

  return (
    <Card style={{ gap: 0 }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm tp-title">
          <TrendingUp className="h-4 w-4" />
          Trending Pages
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="tp-list">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="tp-skeleton-row">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}

          {!loading &&
            items.map((item) => (
              <a
                key={item.category}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-muted/50 rounded transition-colors tp-link"
              >
                <div className="tp-link-content">
                  <img src={item.favicon} alt="" className="tp-favicon" />
                  <div className="tp-text">
                    <p className="text-sm font-medium tp-domain">{item.domain}</p>
                    <p className="text-xs text-muted-foreground">{item.certifiers} certifiers</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs tp-badge">
                  {CATEGORY_LABELS[item.category]}
                </Badge>
              </a>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
