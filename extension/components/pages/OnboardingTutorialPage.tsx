import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import screenshotGroup from '../../assets/youtubegroup.png'
import screenshotDetail from '../../assets/details.png'
import screenshotProfile from '../../assets/profil.png'
import screenshotProof from '../../assets/proof.png'
import screenshotTrust from '../../assets/trustpage.png'
import screenshotSelect from '../../assets/selectbookmark.png'
import '../styles/OnboardingStyles.css'

interface TutorialStep {
  title: string
  description: string
  screenshot: string
}

const STEPS: TutorialStep[] = [
  {
    title: 'Your Intention Groups',
    description: 'Your navigation will be organized into groups by domain. Each group represents a topic or interest you engage with online.',
    screenshot: screenshotGroup
  },
  {
    title: 'Certify on-chain',
    description: 'Inside each group, you can certify URLs on-chain. This creates a verifiable attestation of your engagement with that content.',
    screenshot: screenshotDetail
  },
  {
    title: 'Proof Analysis',
    description: 'Your certifications build a verifiable on-chain profile. This data is analyzed to generate a proof of your interests and intentions, creating a unique digital identity.',
    screenshot: screenshotProof
  },
  {
    title: 'Earn XP & Level Up',
    description: 'Each certification earns you XP. Level up your groups to unlock higher attestation weight and build your on-chain reputation.',
    screenshot: screenshotProfile
  },
  {
    title: 'Connect with Friends',
    description: 'Trust your friends to discover what they are up to and share with them directly in Sofia.',
    screenshot: screenshotTrust
  },
  {
    title: 'Select & Import',
    description: 'Next, select the bookmarks you want to import locally. These URLs reflect your browsing habits. Once imported, certify them on-chain to affirm your intentions and link them to your profile.',
    screenshot: screenshotSelect
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
    navigateTo('home-connected')
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
          <img
            src={step.screenshot}
            alt={step.title}
            className={`tutorial-screenshot ${currentStep === 0 || isLastStep ? 'tutorial-screenshot-small' : ''}`}
          />
          <h2 className="onboarding-title">{step.title}</h2>
          <p className="onboarding-description">{step.description}</p>
        </div>

        <div className="onboarding-actions">
          <button
            className="onboarding-btn onboarding-btn-primary"
            onClick={handleNext}
          >
            {isLastStep ? 'Import my bookmarks' : 'Next'}
          </button>
          {currentStep > 0 && (
            <button
              className="onboarding-btn onboarding-btn-secondary"
              onClick={handleBack}
            >
              Back
            </button>
          )}
          {(currentStep === 0 || isLastStep) && (
            <button
              className="onboarding-btn onboarding-btn-secondary"
              onClick={handleSkip}
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OnboardingTutorialPage
