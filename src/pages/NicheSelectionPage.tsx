import { useNavigate } from 'react-router-dom'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import NicheSelector from '@/components/profile/NicheSelector'
import PageHeader from '@/components/PageHeader'
import '@/components/styles/pages.css'

export default function NicheSelectionPage() {
  const navigate = useNavigate()
  const { selectedTopics, selectedCategories, toggleCategory } = useTopicSelection()

  return (
    <div>
      <PageHeader color="#ffffff" glow="rgba(255,255,255,0.2)" title="Select Categories" subtitle="Refine your areas of expertise" />
      <div className="page-content page-enter">
        <NicheSelector
          selectedTopics={selectedTopics}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          onBack={() => navigate('/profile')}
          onContinue={() => navigate('/profile')}
        />
      </div>
    </div>
  )
}
