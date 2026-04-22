import { useNavigate } from 'react-router-dom'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import NicheSelector from '@/components/profile/NicheSelector'
import { SubHeader } from '@0xsofia/design-system'
import '@/components/styles/pages.css'

export default function NicheSelectionPage() {
  const navigate = useNavigate()
  const { selectedTopics, selectedCategories, toggleCategory } = useTopicSelection()

  return (
    <div className="pf-view page-enter">
      <SubHeader
        onBack={() => navigate('/profile')}
        backLabel="Back to Profile"
        crumbs={[{ label: 'Profile' }, { label: 'Select Categories' }]}
        description="Refine your expertise across your selected topics."
      />
      <NicheSelector
        selectedTopics={selectedTopics}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        onBack={() => navigate('/profile')}
        onContinue={() => navigate('/profile')}
      />
    </div>
  )
}
