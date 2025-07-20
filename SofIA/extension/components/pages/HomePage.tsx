import WalletConnectionButton from '../THP_WalletConnectionButton'
import logoIcon from '../../assets/iconcolored.png'

const HomePage = () => {
  return (
    <div style={styles.homePage}>
      <div style={styles.logoContainer}>
        <img src={logoIcon} alt="Sofia" style={styles.logo} />
      </div>
      <h1 style={styles.welcomeTitle}>Welcome to Sofia</h1>
      <div style={styles.connectSection}>
        <WalletConnectionButton />
      </div>
    </div>
  )
}

const styles = {
  homePage: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    textAlign: 'center' as const
  },
  logoContainer: {
    marginBottom: '30px'
  },
  logo: {
    width: '80px',
    height: '80px'
  },
  welcomeTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: '32px',
    fontWeight: '700',
    color: '#FBF7F5',
    marginBottom: '40px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
  },
  connectSection: {
    marginTop: '20px'
  }
}

export default HomePage