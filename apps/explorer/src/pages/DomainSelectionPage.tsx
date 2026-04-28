import { useNavigate } from 'react-router-dom'
import { useTopicSync } from '@/hooks/useTopicSync'
import DomainSelector from '@/components/profile/DomainSelector'
import { PageHero } from '@0xsofia/design-system'
import { PAGE_COLORS } from '@/config/pageColors'
import { ArrowLeft } from 'lucide-react'
import '@/components/styles/pages.css'

const MAX_TOPICS = 4

export default function DomainSelectionPage() {
  const navigate = useNavigate()
  const { selectedTopics, toggleTopic, removeTopic, hasPosition, isPending } =
    useTopicSync()
  const pc = PAGE_COLORS['/profile/topics']

  const handleToggle = (topicId: string) => {
    const isSelected = selectedTopics.includes(topicId)
    if (isSelected) {
      removeTopic(topicId) // redeem if on-chain, else just remove locally
    } else {
      toggleTopic(topicId) // add locally + auto-add to cart
    }
  }

  return (
    <div className="pf-view page-enter">
      <button
        type="button"
        className="pf-btn"
        onClick={() => navigate('/profile')}
        style={{ marginBottom: 16 }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to my profile
      </button>
      <PageHero
        title={pc.title}
        description={pc.subtitle}
        background={pc.color}
      />
      <DomainSelector
        selectedTopics={selectedTopics}
        onToggle={handleToggle}
        onContinue={() => navigate('/profile')}
        onBack={() => navigate('/profile')}
        hasPosition={hasPosition}
        isPending={isPending}
      />
    </div>
  )
}
