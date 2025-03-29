import { createContext } from 'react';
import { useAuthClient } from '@dfinity/use-auth-client';
import { type ActorSubclass } from '@dfinity/agent';
import { type _SERVICE } from '@/declarations/backend/backend.did';

export type AuthContextType = Omit<
  ReturnType<typeof useAuthClient>,
  'actor' | 'actors'
> & {
  actor: ActorSubclass<_SERVICE>;
};

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType,
);
