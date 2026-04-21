import { useNavigate } from 'react-router-dom'
import { useTopicSync } from '@/hooks/useTopicSync'
import DomainSelector from '@/components/profile/DomainSelector'
import PageHeader from '@/components/PageHeader'
import '@/components/styles/pages.css'

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
    <div>
      <PageHeader color="#ffffff" glow="rgba(255,255,255,0.2)" title="Select Topics" subtitle="Choose your areas of interest" />
      <div className="page-content page-enter">
        <DomainSelector
          selectedTopics={selectedTopics}
          onToggle={handleToggle}
          onContinue={() => navigate('/profile')}
          onBack={() => navigate('/profile')}
          hasPosition={hasPosition}
          isPending={isPending}
        />
      </div>
    </div>
  )
}
