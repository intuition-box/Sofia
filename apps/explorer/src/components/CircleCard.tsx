import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronUp, ChevronDown, ExternalLink } from 'lucide-react'
import IntentionTooltip from '@/components/IntentionTooltip'
import type { CircleItem } from '@/services/circleService'
import { INTENTION_COLORS } from '@/config/intentions'
import { TOPIC_META } from '@/config/topicMeta'
import { SOFIA_TOPICS } from '@/config/taxonomy'
import { timeAgo } from '@/utils/formatting'

/** Connector phrase displayed after the title for each intention */
const INTENTION_CONNECTOR: Record<string, string> = {
  Trusted: '',
  Distrusted: '',
  Work: 'is for',
  Learning: 'is for',
  Fun: 'is for',
  Inspiration: 'is for',
  Buying: 'is for',
  Music: 'is for',
  Attending: 'is',
  Valued: 'has value',
}

interface CircleCardProps {
  item: CircleItem
  displayName: string
  avatar: string
  isPrivate?: boolean
  onDeposit?: (side: 'support' | 'oppose', item: CircleItem) => void
}

export default function CircleCard({ item, displayName, avatar, isPrivate, onDeposit }: CircleCardProps) {
  const shownName = isPrivate ? 'Someone' : displayName
  const isDirectVerb = item.intentions.every((i) => i === 'Trusted' || i === 'Distrusted' || i === 'is following')

  return (
    <Card className="p-4 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Header: avatar + name + time + favicon */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {!isPrivate && <img src={avatar} alt="" className="h-6 w-6 rounded-full shrink-0" referrerPolicy="no-referrer" />}
          <span className="text-sm font-bold truncate">{shownName}</span>
          <span className="text-xs text-muted-foreground shrink-0">{timeAgo(item.timestamp)}</span>
        </div>
        {item.domain ? (
          <a href={`https://${item.domain}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <img
              src={item.favicon}
              alt={item.domain}
              className="h-8 w-8 rounded-lg bg-muted cursor-pointer hover:opacity-80 transition-opacity"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </a>
        ) : (
          <img
            src={item.favicon}
            alt=""
            className="h-8 w-8 rounded-lg bg-muted shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
      </div>

      {/* Phrase */}
      <p className="text-sm leading-relaxed">
        <span className="font-semibold">{shownName}</span>
        {' '}
        {isDirectVerb ? (
          <>
            {item.intentions.map((intent, i) => {
              const intentColor = INTENTION_COLORS[intent] ?? 'var(--foreground)'
              return (
                <span key={intent}>
                  {i > 0 && <span className="text-muted-foreground">{i === item.intentions.length - 1 ? ' & ' : ', '}</span>}
                  <IntentionTooltip termId={item.intentionVaults[intent]?.termId} color={intentColor}>
                    <span style={{ color: intentColor, fontWeight: 600 }}>{intent.toLowerCase()}</span>
                  </IntentionTooltip>
                </span>
              )
            })}
            {' '}
            <span className="font-semibold">{item.title}</span>
          </>
        ) : (
          <>
            <span className="text-muted-foreground">claims </span>
            <span className="font-semibold">{item.title}</span>
            {' '}
            {item.intentions.map((intent, i) => {
              const connector = INTENTION_CONNECTOR[intent] ?? ''
              const intentColor = INTENTION_COLORS[intent] ?? 'var(--foreground)'
              return (
                <span key={intent}>
                  {i > 0 && <span className="text-muted-foreground">{i === item.intentions.length - 1 ? ' & ' : ', '}</span>}
                  {i === 0 && connector && <span className="text-muted-foreground">{connector} </span>}
                  <IntentionTooltip termId={item.intentionVaults[intent]?.termId} color={intentColor}>
                    <span style={{ color: intentColor, fontWeight: 600 }}>{intent.toLowerCase()}</span>
                  </IntentionTooltip>
                </span>
              )
            })}
          </>
        )}
      </p>
      {/* Topic context badges */}
      {item.topicContexts?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.topicContexts.map((slug) => {
            const meta = TOPIC_META[slug]
            const label = SOFIA_TOPICS.find((t) => t.id === slug)?.label ?? slug
            return (
              <span
                key={slug}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `color-mix(in oklab, ${meta?.color ?? '#888'} 15%, transparent)`,
                  color: meta?.color ?? '#888',
                  border: `1px solid color-mix(in oklab, ${meta?.color ?? '#888'} 25%, transparent)`,
                }}
              >
                {label}
              </span>
            )
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline" size="sm" className="text-xs h-7 gap-1 btn-hover-support"
          disabled={Object.keys(item.intentionVaults).length === 0}
          onClick={() => onDeposit?.('support', item)}
        >
          <ChevronUp className="h-3.5 w-3.5" />
          Support
        </Button>
        <Button
          variant="outline" size="sm" className="text-xs h-7 gap-1 btn-hover-oppose"
          disabled={!Object.values(item.intentionVaults).some(v => v.counterTermId)}
          onClick={() => onDeposit?.('oppose', item)}
        >
          <ChevronDown className="h-3.5 w-3.5" />
          Oppose
        </Button>
        {item.url && (
          <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" asChild>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </div>
    </Card>
  )
}
