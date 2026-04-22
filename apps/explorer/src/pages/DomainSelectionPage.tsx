import { useNavigate } from 'react-router-dom'
import { useTopicSync } from '@/hooks/useTopicSync'
import DomainSelector from '@/components/profile/DomainSelector'
import { SubHeader } from '@0xsofia/design-system'
import '@/components/styles/pages.css'

const MAX_TOPICS = 3

export default function DomainSelectionPage() {
  const navigate = useNavigate()
  const { selectedTopics, toggleTopic, removeTopic, hasPosition, isPending } = useTopicSync()

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
      <SubHeader
        onBack={() => navigate('/profile')}
        backLabel="Back to Profile"
        crumbs={[{ label: 'Profile' }, { label: 'Select Topics' }]}
        rightPill={{ label: 'Selected', value: `${selectedTopics.length} / ${MAX_TOPICS}` }}
        description="Pick the topics that anchor your knowledge graph."
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
