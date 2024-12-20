'use client';

import type { Err, UserProfile } from '@/declarations/backend/backend.did';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { renderError } from '@/lib/utils';

type UserContextType = {
  user: UserProfile | null;
  fetchUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  fetchUser: () => Promise.reject(),
});

type UserProviderProps = {
  children: React.ReactNode;
};

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { actor } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  const fetchUser = useCallback(async () => {
    await actor?.get_my_user_profile().then(res => {
      if ('ok' in res) {
        setUser(res.ok);
      } else {
        toast({
          title: 'Error fetching user',
          description: renderError(res.err),
          variant: 'destructive',
        });
      }
    });
  }, [actor, toast]);

  useEffect(() => {
    const showErrorToast = (resErr: Err, title: string) => {
      toast({
        title,
        description: renderError(resErr),
        variant: 'destructive',
      });
    };

    actor?.get_my_user_profile().then(res => {
      if ('ok' in res) {
        setUser(res.ok);
      } else if (res.err.code === 404) {
        // a user profile does not exist yet
        actor.create_my_user_profile().then(res => {
          if ('ok' in res) {
            setUser(res.ok);
          } else {
            showErrorToast(res.err, 'Error creating user');
          }
        });
      } else {
        showErrorToast(res.err, 'Error getting user');
      }
    });
    // We want to run this effect only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UserContext.Provider value={{ user, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => useContext(UserContext);
