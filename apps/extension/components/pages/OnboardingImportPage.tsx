import { useState } from 'react'
import { Storage } from '@plasmohq/storage'
import { useRouter } from '../layout/RouterProvider'
import FullScreenLoader from '../ui/FullScreenLoader'
import welcomeLogo from '../ui/icons/welcomeLogo.png'
import '../styles/OnboardingStyles.css'

const storage = new Storage()

const OnboardingImportPage = () => {
  const { navigateTo, setOnboardingBookmarks } = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showSkipMessage, setShowSkipMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackingConsent, setTrackingConsent] = useState(false)

  // Persist the user's consent choice before moving on. Tracking starts
  // collecting URL visits only when this flag is explicitly true.
  const persistConsent = async () => {
    await storage.set('tracking_enabled', trackingConsent)
    await storage.set('tracking_consent_seen', true)
  }

  const handleImport = async () => {
    await persistConsent()
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

  const handleSkip = async () => {
    await persistConsent()
    setShowSkipMessage(true)
    setTimeout(() => {
      navigateTo('mark')
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

          <label className="onboarding-consent">
            <input
              type="checkbox"
              checked={trackingConsent}
              onChange={(e) => setTrackingConsent(e.target.checked)}
            />
            <span className="onboarding-consent-text">
              <strong>Enable browsing tracking</strong> — Sofia will record
              the URLs and titles of pages you visit, locally on your device,
              so it can suggest pages to Mark and group them into Echoes.
              Sensitive pages (banking, auth, checkout) are always excluded.
              You can turn this off anytime in Settings.
              <a
                href="https://doc.sofia.intuition.box/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy policy
              </a>
            </span>
          </label>

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
