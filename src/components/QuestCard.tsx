import { Card } from '@/components/ui/card'
import type { CircleItem } from '@/services/circleService'
import { timeAgo } from '@/utils/formatting'
import '@/components/styles/pages.css'

const QUEST_CATEGORY_STYLES: Record<string, string> = {
  daily:     '#E4C65A',
  streak:    '#E0896A',
  milestone: '#A78BDB',
  discovery: '#5CC4D6',
  gold:      '#D4A843',
  vote:      '#7BADE0',
  social:    '#D98CB3',
}

function SofiaMini({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 698 696" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M127.754 320.87V286.709C127.755 252.461 127.754 225.932 179.483 207.94L350.054 133L698 285.875V524.148L350.054 696L0 546.863V480.507L339.656 624.533C346.079 627.359 353.409 627.257 359.751 624.255L622.734 499.774C631.209 495.763 636.614 487.214 636.614 477.824V343.067C636.614 333.463 630.963 324.76 622.198 320.87L359.745 204.39C353.572 201.651 346.54 201.615 340.341 204.292L232.631 250.806C199.278 264.642 189.141 277.017 189.14 286.709V346.222L127.754 320.87Z" fill={color} />
      <path d="M570.246 375.13V409.291C570.245 443.539 570.246 470.068 518.517 488.06L347.946 563L6.19888e-06 410.125V171.852L347.946 0L698 149.137V215.493L358.344 71.4668C351.921 68.6409 344.591 68.7428 338.249 71.745L75.2657 196.226C66.7914 200.237 61.3862 208.786 61.3862 218.176V352.933C61.3864 362.537 67.0374 371.239 75.802 375.13L338.255 491.61C344.428 494.349 351.46 494.385 357.659 491.708L465.369 445.194C498.722 431.358 508.859 418.983 508.86 409.291V349.778L570.246 375.13Z" fill={color} />
    </svg>
  )
}

interface QuestCardProps {
  item: CircleItem
  displayName: string
  avatar: string
  isPrivate?: boolean
}

export default function QuestCard({ item, displayName, avatar, isPrivate }: QuestCardProps) {
  const category = item.intentions[0]?.replace('quest:', '') ?? 'milestone'
  const color = QUEST_CATEGORY_STYLES[category] ?? QUEST_CATEGORY_STYLES.milestone
  const shownName = isPrivate ? 'A user' : displayName

  return (
    <Card
      className="p-4 flex flex-col gap-2 hover:shadow-md transition-shadow"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isPrivate && <img src={avatar} alt="" className="h-6 w-6 rounded-full shrink-0" referrerPolicy="no-referrer" />}
          <span className="text-sm font-bold">{shownName}</span>
          <span className="text-xs text-muted-foreground">{timeAgo(item.timestamp)}</span>
        </div>
        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)` }}>
          <SofiaMini color={color} size={20} />
        </div>
      </div>
      <p className="text-sm">
        <span className="text-muted-foreground">earned</span>
        {' '}
        <span style={{ color, fontWeight: 700 }}>{item.title}</span>
      </p>
    </Card>
  )
}
