import { createContext } from 'react';
import { useAuthClient } from '@dfinity/use-auth-client';
import { type backendInterface } from '@/lib/api/backend/backend';

export type AuthContextType = Omit<
  ReturnType<typeof useAuthClient>,
  'actor' | 'actors'
> & {
  actor: backendInterface;
};

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType,
);
