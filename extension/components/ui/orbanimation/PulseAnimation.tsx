import './PulseAnimation.css'

interface PulseAnimationProps {
  size?: number
  isAnalyzing?: boolean
  onToggleMenu?: () => void
  showMenu?: boolean
}

const PulseAnimation = ({
  size = 60,
  isAnalyzing = false,
  onToggleMenu,
  showMenu = false
}: PulseAnimationProps) => {
  const handleClick = () => {
    if (!isAnalyzing && onToggleMenu) {
      onToggleMenu()
    }
  }

  return (
    <div className="container-vao">
      <input
        type="checkbox"
        className="input-orb"
        id="v.a.o."
        name="v.a.o."
        checked={showMenu}
        onChange={handleClick}
        style={{ display: 'none' }}
      />
      <label htmlFor="v.a.o." className="orb">
        <div className="ball">
          <div className="container-lines"></div>
          <div className="container-rings"></div>
        </div>
        <svg style={{ pointerEvents: 'none' }}>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6"></feGaussianBlur>
            <feColorMatrix
              values="1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 20 -10"
            ></feColorMatrix>
          </filter>
        </svg>
      </label>

      {isAnalyzing && (
        <div className="analyzing-text">
          Analyzing...
        </div>
      )}
    </div>
  )
}

export default PulseAnimation
