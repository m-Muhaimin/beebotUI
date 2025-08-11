import { useState, useEffect } from 'react';

const WELCOME_SCREEN_KEY = 'beebot-welcome-completed';

export function useWelcome() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has seen welcome screen before
    const hasSeenWelcome = localStorage.getItem(WELCOME_SCREEN_KEY);
    
    // Small delay to ensure smooth loading
    setTimeout(() => {
      setShowWelcome(!hasSeenWelcome);
      setIsLoading(false);
    }, 100);
  }, []);

  const completeWelcome = () => {
    localStorage.setItem(WELCOME_SCREEN_KEY, 'true');
    setShowWelcome(false);
  };

  const resetWelcome = () => {
    localStorage.removeItem(WELCOME_SCREEN_KEY);
    setShowWelcome(true);
  };

  return {
    showWelcome,
    isLoading,
    completeWelcome,
    resetWelcome,
  };
}