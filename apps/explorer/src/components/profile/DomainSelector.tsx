import { SOFIA_TOPICS } from '../../config/taxonomy'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Check, ArrowLeft, Clock, Link } from 'lucide-react'
import '../styles/domain-selector.css'

const TOPIC_ICONS: Record<string, string> = {
  'tech-dev': '💻',
  'design-creative': '🎨',
  'music-audio': '🎵',
  gaming: '🎮',
  'web3-crypto': '⛓️',
  science: '🔬',
  'sport-health': '🏋️',
  'video-cinema': '📹',
  entrepreneurship: '🚀',
  'performing-arts': '🎭',
  'nature-environment': '🌿',
  'food-lifestyle': '🍽️',
  literature: '📚',
  'personal-dev': '🧠',
}

interface TopicSelectorProps {
  selectedTopics: string[]
  onToggle: (topicId: string) => void
  onContinue: () => void
  onBack?: () => void
  /** Check if topic has confirmed on-chain position */
  hasPosition?: (topicId: string) => boolean
  /** Check if topic is selected but not yet confirmed on-chain */
  isPending?: (topicId: string) => boolean
}

export default function DomainSelector({
  selectedTopics,
  onToggle,
  onContinue,
  onBack,
  hasPosition,
  isPending,
}: TopicSelectorProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Select your topics</h2>
        <Badge variant="secondary" className="text-sm px-3 py-1">{selectedTopics.length} / 3</Badge>
      </div>

      <div className="grid gap-4 mt-4 ds-grid">
        {SOFIA_TOPICS.map((topic) => {
          const isSelected = selectedTopics.includes(topic.id)
          const confirmed = hasPosition?.(topic.id) ?? false
          const pending = isPending?.(topic.id) ?? false
          const nicheCount = topic.categories.reduce((s, c) => s + c.niches.length, 0)
          const atLimit = selectedTopics.length >= 3 && !isSelected

          return (
            <Card
              key={topic.id}
              className={`p-6 transition-all ${
                atLimit
                  ? 'opacity-40 cursor-not-allowed'
                  : 'cursor-pointer hover:shadow-md'
              } ${
                isSelected
                  ? confirmed
                    ? 'ring-2 ring-emerald-500 bg-emerald-500/5'
                    : 'ring-2 ring-primary bg-primary/5'
                  : ''
              }`}
              onClick={() => !atLimit && onToggle(topic.id)}
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{TOPIC_ICONS[topic.id] || '📌'}</span>
                {isSelected && (
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    confirmed
                      ? 'bg-emerald-500 text-white'
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {confirmed
                      ? <Link className="h-3.5 w-3.5" />
                      : pending
                        ? <Clock className="h-3.5 w-3.5" />
                        : <Check className="h-3.5 w-3.5" />
                    }
                  </div>
                )}
              </div>
              <div className="mt-3">
                <p className="font-medium text-base">{topic.label}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {topic.categories.length} categories · {nicheCount} niches
                </p>
                {isSelected && pending && (
                  <p className="text-xs text-amber-500 mt-1">
                    Pending — confirm deposit in cart
                  </p>
                )}
                {isSelected && confirmed && (
                  <p className="text-xs text-emerald-500 mt-1">
                    On-chain position active
                  </p>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex gap-2 pb-6 ds-actions">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        <Button className="flex-1" onClick={onContinue} disabled={selectedTopics.length === 0}>
          Continue
        </Button>
      </div>
    </div>
  )
}
