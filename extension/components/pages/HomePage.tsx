import WalletConnectionButton from '../ui/THP_WalletConnectionButton'
import welcomeLogo from '../ui/icons/welcomeLogo.png'
import '../styles/HomePage.css'

const HomePage = () => {

  return (
    <div className="home-page">
      <div className="welcome-header">
        <img src={welcomeLogo} alt="Welcome on SofIA" className="welcome-image" />
      </div>

      <div className="description-sections">
        <p className="description-paragraph">
        Sofia is a decentralized, intelligent interface that captures your web navigation, transforms it into verifiable knowledge, and helps you better understand – and leverage – your digital self.
        </p>

        <p className="description-paragraph">
        Every visited page, every action, every interest becomes a signal (who/what you are – what you do – on what content) stored under your control. 
        </p>

        <p className="description-paragraph">
        This creates a living, semantic graph of your online activity, which you can enrich, share and get certified.
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