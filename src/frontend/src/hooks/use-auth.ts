import { type AuthContextType, AuthContext } from '@/contexts/auth-context';
import { useContext } from 'react';

export const useAuth = (): AuthContextType => useContext(AuthContext);
