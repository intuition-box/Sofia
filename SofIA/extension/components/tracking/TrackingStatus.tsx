import toggleTrue from "../ui/icons/Toggle=true.png";
import toggleFalse from "../ui/icons/Toggle=false.png";

interface TrackingStatusProps {
  isEnabled: boolean;
  onToggle: () => void;
}

const TrackingStatus = ({ isEnabled, onToggle }: TrackingStatusProps) => {
  return (
    <button
      onClick={onToggle}
      style={styles.toggleButton}
    >
      <img 
        src={isEnabled ? toggleTrue : toggleFalse}
        alt={isEnabled ? "Enabled" : "Disabled"}
        style={styles.toggleImage}
      />
    </button>
  );
};

const styles = {
  toggleButton: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease'
  },
  toggleImage: {
    width: '50px !important',
    height: '25px !important',
    minWidth: '50px !important',
    minHeight: '25px !important',
    maxWidth: '50px !important',
    maxHeight: '25px !important',
    display: 'block',
    objectFit: 'contain' as const,
    transition: 'none'
  }
};

export default TrackingStatus;