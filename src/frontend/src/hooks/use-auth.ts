import { type AuthContextType, AuthContext } from '@/contexts/auth-context';
import { useContext } from 'react';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};
