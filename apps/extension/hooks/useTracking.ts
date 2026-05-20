import { useStorage } from '@plasmohq/storage/hook';

export const useTracking = () => {
  const [isTrackingEnabled, setIsTrackingEnabled] = useStorage('tracking_enabled', false);

  const toggleTracking = async () => {
    setIsTrackingEnabled(!isTrackingEnabled);
  };

  return {
    isTrackingEnabled,
    toggleTracking
  };
};