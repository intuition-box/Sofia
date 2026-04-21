import PageHeader from '@/components/PageHeader'
import { PAGE_COLORS } from '@/config/pageColors'
import '@/components/styles/pages.css'

export default function ScoresPage() {
  const pc = PAGE_COLORS['/profile/scores']

  return (
    <div>
      <PageHeader color={pc.color} glow={pc.glow} title={pc.title} subtitle={pc.subtitle} />
      <div className="page-content page-enter">
        <p className="text-sm text-muted-foreground text-center py-16">Coming soon</p>
      </div>
    </div>
  )
}
