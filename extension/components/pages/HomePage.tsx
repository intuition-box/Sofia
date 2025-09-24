import WalletConnectionButton from '../ui/THP_WalletConnectionButton'
import welcomeLogo from '../ui/icons/Welcomelogo.png'
import '../styles/HomePage.css'

const HomePage = () => {

  return (
    <div className="home-page">
      <div className="welcome-header">
        <img src={welcomeLogo} alt="Welcome on SofIA" className="welcome-image" />
      </div>

      <div className="description-sections">
        <p className="description-paragraph">
          SofIA is an intelligent Chrome extension that helps you better use the internet every day. The system assists you by tracking your browsing and creates a secure digital memory that you fully control and share with anyone you wish.
        </p>

        <p className="description-paragraph">
          SofIA generates intelligent content and recommendations tailored to your tastes and visual context, while respecting your privacy.
        </p>

        <p className="description-paragraph">
          It's like a personal assistant connected to the web, supporting you in your research, learning, and projects, and helping you discover what really matters to you.
        </p>

        <p className="description-paragraph">
          By combining personal history and decentralized certification via Intuition Systems, Sofia validates your browsing in the form of attested signals to provide reliable and verifiable recommendations.
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