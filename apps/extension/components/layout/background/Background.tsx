import "./Background.css"

interface BackgroundProps {
  className?: string;
}

const Background = ({ className }: BackgroundProps) => {
  return (
    <div className={`animated-background ${className || ''}`} />
  );
};

export default Background;