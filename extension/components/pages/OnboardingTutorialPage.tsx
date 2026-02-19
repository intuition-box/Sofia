import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import screenshotGroup from '../../assets/youtubegroup.png'
import screenshotDetail from '../../assets/details.png'
import screenshotGold from '../../assets/gold.png'
import screenshotQuests from '../../assets/quests.png'
import screenshotPulse from '../../assets/pulse.png'
import screenshotInterest from '../../assets/interest.png'
import screenshotCircle from '../../assets/circle.png'
import screenshotStreak from '../../assets/streak.png'
import screenshotCommunity from '../../assets/community.png'
import screenshotChat from '../../assets/chat.png'
import screenshotProfile from '../../assets/profil.png'
import screenshotSelect from '../../assets/selectbookmark.png'
import '../styles/OnboardingStyles.css'

interface TutorialStep {
  title: string
  description: string
  screenshot: string
}

const STEPS: TutorialStep[] = [
  // --- Bloc 1: Core (groupes, certify, gold, profil) ---
  {
    title: 'Your Intention Groups',
    description:
      'Your navigation will be organized into groups by domain. Each group represents a topic or interest you engage with online.',
    screenshot: screenshotGroup
  },
  {
    title: 'Certify on-chain',
    description:
      'Inside each group, you can certify URLs on-chain. This creates a verifiable attestation of your engagement with that content.',
    screenshot: screenshotDetail
  },
  {
    title: 'Earn Gold & Level Up',
    description:
      'Each certification earns you Gold. Spend Gold to level up your groups and unlock higher attestation weight. Complete quests to earn public XP and build your on-chain reputation.',
    screenshot: screenshotGold
  },
  {
    title: 'Your Profile',
    description:
      'Track your level, XP progress, and discovery badges in your profile. See your stats grow as you certify, explore, and contribute to the knowledge graph.',
    screenshot: screenshotProfile
  },
  // --- Bloc 2: Gamification (quests, streaks) ---
  {
    title: 'Complete Quests',
    description:
      'Unlock achievements by completing quests: create signals, bookmark URLs, connect social accounts, run Pulse analysis, and more. Claim quest badges to earn XP and track your progress.',
    screenshot: screenshotQuests
  },
  {
    title: 'Streaks & Leaderboard',
    description:
      'Certify or vote every day to build your streak. Compete with other users on the global leaderboard and climb the rankings by maintaining daily activity.',
    screenshot: screenshotStreak
  },
  // --- Bloc 3: AI (pulse, interests) ---
  {
    title: 'Pulse Analysis',
    description:
      'Launch Pulse to let Sofia analyze your open tabs. The AI extracts themes and semantic signals from your browsing session, helping you discover patterns in your activity.',
    screenshot: screenshotPulse
  },
  {
    title: 'Interest Analysis',
    description:
      'Your certifications build a verifiable on-chain profile. This data is analyzed to generate a map of your interests and intentions, creating a unique digital identity.',
    screenshot: screenshotInterest
  },
  // --- Bloc 4: Social (community, circle, chat) ---
  {
    title: 'Connect with Friends',
    description:
      'Follow and trust your friends to discover what they certify. Connect your social accounts (X, Discord, YouTube, Twitch, Spotify) to verify your identity and unlock social quests.',
    screenshot: screenshotCommunity
  },
  {
    title: 'Circle & Voting',
    description:
      'See what your trust circle is certifying in the Circle feed. Like or dislike their certifications to express your opinion and contribute to content curation.',
    screenshot: screenshotCircle
  },
  {
    title: 'Chat with Sofia',
    description:
      'Ask Sofia anything! Your AI assistant can help you explore your browsing data, get personalized recommendations, and navigate the Intuition knowledge graph.',
    screenshot: screenshotChat
  },
  // --- Bloc 5: Onboarding final ---
  {
    title: 'Select & Import',
    description:
      'Next, select the bookmarks you want to import locally. These URLs reflect your browsing habits. Once imported, certify them on-chain to affirm your intentions and link them to your profile.',
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
