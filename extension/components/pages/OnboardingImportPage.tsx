import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import FullScreenLoader from '../ui/FullScreenLoader'
import welcomeLogo from '../ui/icons/welcomeLogo.png'
import '../styles/OnboardingStyles.css'

const OnboardingImportPage = () => {
  const { navigateTo, setOnboardingBookmarks } = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showSkipMessage, setShowSkipMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImport = () => {
    setIsLoading(true)
    setError(null)
    chrome.runtime.sendMessage({ type: 'FETCH_BOOKMARKS' }, (response) => {
      setIsLoading(false)
      if (response?.success && response.bookmarks?.length > 0) {
        setOnboardingBookmarks(response.bookmarks)
        navigateTo('onboarding-tutorial')
      } else if (response?.bookmarks?.length === 0) {
        setError('No bookmarks found in your browser.')
      } else {
        setError(response?.error || 'Failed to fetch bookmarks.')
      }
    })
  }

  const handleSkip = () => {
    setShowSkipMessage(true)
    setTimeout(() => {
      navigateTo('home-connected')
    }, 2500)
  }

  if (showSkipMessage) {
    return (
      <div className="onboarding-page">
        <div className="onboarding-skip-message">
          <p>You can always import your data from the central orb at any time.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <FullScreenLoader
        isVisible={isLoading}
        message="Loading your bookmarks..."
      />
      <div className="onboarding-page">
        <div className="onboarding-header">
          <img src={welcomeLogo} alt="Welcome to Sofia" className="onboarding-logo" />
        </div>

        <div className="onboarding-content">
          <h2 className="onboarding-title">Welcome to Sofia</h2>
          <p className="onboarding-description">
            Would you like to import your browser bookmarks? They will be organized into intention groups by domain, ready to be certified on-chain.
          </p>
          {error && <p className="onboarding-error">{error}</p>}
        </div>

        <div className="onboarding-actions">
          <button
            className="onboarding-btn onboarding-btn-primary"
            onClick={handleImport}
            disabled={isLoading}
          >
            Start Tutorial
          </button>
          <button
            className="onboarding-btn onboarding-btn-secondary"
            onClick={handleSkip}
          >
            Skip for now
          </button>
        </div>
      </div>
    </>
  )
}

export default OnboardingImportPage
