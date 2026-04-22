import { PageHero } from '@0xsofia/design-system'
import { PAGE_COLORS } from '@/config/pageColors'
import '@/components/styles/pages.css'

export default function ScoresPage() {
  const pc = PAGE_COLORS['/profile/scores']

  return (
    <div>
      <PageHero background={pc.color} title={pc.title} description={pc.subtitle} />
      <div className="page-content page-enter">
        <p className="text-sm text-muted-foreground text-center py-16">Coming soon</p>
      </div>
    </div>
  )
}
