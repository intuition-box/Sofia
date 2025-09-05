import { useState } from 'react'
import WalletConnectionButton from '../THP_WalletConnectionButton'
import welcomeImage from '../ui/icons/Welcome.png'
import '../styles/HomePage.css'

const HomePage = () => {

  return (
    <div className="home-page">
      <div className="welcome-header">
        <img src={welcomeImage} alt="Welcome on SofIA" className="welcome-image" />
      </div>

      <div className="description-sections">
        <p className="description-paragraph">
          SofIA is a smart Chrome extension that helps you better use the internet every day of the week. The system helps you by tracking your browsing and creates a secure digital memory that you fully control.
        </p>

        <p className="description-paragraph">
          SofIA allows you to generate smart content, stories and advice tailored to your tastes and graphic contexts, while respecting your privacy.
        </p>

        <p className="description-paragraph">
          It's like a personal assistant connected to the web, helping with research, learning and projects, and discover what really matters to you.
        </p>

        <p className="description-paragraph">
          By combining personal history and decentralized certification via Intuition Systems, SofIA Validation facts in the form of attested triplets, to provide reliable and verifiable recommendations.
        </p>

        <p className="description-paragraph terms-text">For more details, please read and accept the <a href="../../docs/terms-and-conditions.md" target="_blank" rel="noopener noreferrer"><strong>Terms and Conditions</strong></a>.</p>
      </div>

      <div className="connect-section">
        <WalletConnectionButton />
      </div>
    </div>
  )
}


export default HomePage