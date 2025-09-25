import { useState, useEffect, useCallback } from 'react';
import { userSession, getUserAddress } from '@/utils/stacks';

export interface UserData {
  address: string | null;
  isSignedIn: boolean;
  profile?: any;
}

export const useStacks = () => {
  const [userData, setUserData] = useState<UserData>({
    address: null,
    isSignedIn: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const updateUserData = useCallback(() => {
    if (userSession.isUserSignedIn()) {
      const profile = userSession.loadUserData();
      setUserData({
        address: getUserAddress(),
        isSignedIn: true,
        profile,
      });
    } else {
      setUserData({
        address: null,
        isSignedIn: false,
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    updateUserData();
    
    // Listen for auth changes
    const handleAuthChange = () => {
      updateUserData();
    };

    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [updateUserData]);

  return {
    userData,
    isLoading,
    updateUserData,
  };
};
