'use client';

import { useContext } from 'react';
import AuthContext from '@/components/context/AuthContext';

// This hook is a simplified way to access the auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;