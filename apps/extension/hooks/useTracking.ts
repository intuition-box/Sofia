import { useStorage } from '@plasmohq/storage/hook';

export const useTracking = () => {
  const [isTrackingEnabled, setIsTrackingEnabled] = useStorage('tracking_enabled', true);

  const toggleTracking = async () => {
    setIsTrackingEnabled(!isTrackingEnabled);
  };

  return {
    isTrackingEnabled,
    toggleTracking
  };
};