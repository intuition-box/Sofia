import { useState } from 'react';

export function useContentReveal() {
  const [showContent, setShowContent] = useState(false);

  const triggerContentReveal = () => {
    // Show content after logo animation (2s) + small delay
    setTimeout(() => {
      setShowContent(true);
    }, 2500);
  };

  return { showContent, triggerContentReveal };
}