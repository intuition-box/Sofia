import { useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from '../layout/RouterProvider'
// Placeholder screenshots — to be recaptured against the current UI.
// (echo card, GroupDetailView, profile, friends/circle, bookmark select)
import screenshotSelect from '../../assets/selectbookmark.png'
import screenshotGroup from '../../assets/youtubegroup.png'
import screenshotDetail from '../../assets/details.png'
import screenshotProfile from '../../assets/profil.png'
import screenshotCommunity from '../../assets/community.png'
import '../styles/OnboardingStyles.css'

interface TutorialStep {
  title: string
  description: ReactNode
  screenshot: string
}

// Order: S, G, M, P, F — import first, then explain what was created.
const STEPS: TutorialStep[] = [
  {
    title: 'Select & Import',
    description: (
      <>
        Pick the bookmarks you want to import. They'll be grouped by domain
        into Echoes, ready to Mark on-chain.{' '}
        <strong>
          Sensitive pages (banking, auth, checkout) are always excluded.
        </strong>
      </>
    ),
    screenshot: screenshotSelect
  },
  {
    title: 'Your Intention Groups',
    description:
      'Your navigation is organized into Echoes — groups by domain. Each Echo represents a topic or interest you engage with online.',
    screenshot: screenshotGroup
  },
  {
    title: 'Mark on-chain',
    description:
      'Inside each Echo, Mark URLs on-chain. This creates a verifiable attestation of your engagement with that content.',
    screenshot: screenshotDetail
  },
  {
    title: 'Your Profile',
    description:
      'Track your level and progress in your profile. Each Mark earns Gold to level up your Echoes and unlock higher attestation weight. Complete quests to claim badges and earn XP — your public, on-chain reputation.',
    screenshot: screenshotProfile
  },
  {
    title: 'Friends & Circle',
    description:
      'Follow and trust friends to discover what they Mark, and connect your social accounts (X, Discord, YouTube, Twitch, Spotify) to unlock social quests. In the Circle feed, like or dislike their Marks to shape content curation.',
    screenshot: screenshotCommunity
  }
]

const OnboardingTutorialPage = () => {
  const { navigateTo } = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  const isLastStep = currentStep === STEPS.length - 1

  const handleNext = () => {
    if (isLastStep) {
      navigateTo('onboarding-select')
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    navigateTo('mark')
  }

  const step = STEPS[currentStep]

  return (
    <div className="onboarding-page">
      <div className="tutorial-card">
        <div className="tutorial-progress">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`tutorial-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
            />
          ))}
        </div>

        <div className="tutorial-content">
          <div className="tutorial-screenshot-frame">
            <img
              src={step.screenshot}
              alt={step.title}
              className="tutorial-screenshot"
            />
          </div>
          <h2 className="onboarding-title">{step.title}</h2>
          <p className="onboarding-description">{step.description}</p>
        </div>

        <div className="onboarding-actions">
          <button
            className="onboarding-btn onboarding-btn-primary"
            onClick={handleNext}
          >
            {isLastStep ? 'Select my bookmarks' : 'Next'}
          </button>
          <div className="tutorial-secondary-actions">
            <button
              className="onboarding-btn onboarding-btn-secondary"
              onClick={handleBack}
              style={{ visibility: currentStep > 0 ? 'visible' : 'hidden' }}
            >
              Back
            </button>
            <button
              className="onboarding-btn onboarding-btn-secondary"
              onClick={handleSkip}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingTutorialPage
