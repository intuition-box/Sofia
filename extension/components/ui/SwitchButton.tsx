import { useId } from 'react';

interface SwitchButtonProps {
  isEnabled: boolean;
  onToggle: () => void;
}

const SwitchButton = ({ isEnabled, onToggle }: SwitchButtonProps) => {
  const id = useId();

  return (
    <label className="switch-button" htmlFor={id}>
      <div className="switch-outer">
        <input
          id={id}
          type="checkbox"
          checked={isEnabled}
          onChange={onToggle}
        />
        <div className="button">
          <span className="button-toggle"></span>
          <span className="button-indicator"></span>
        </div>
      </div>
    </label>
  );
};

export default SwitchButton;
