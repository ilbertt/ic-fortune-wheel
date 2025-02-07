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
import { enumKey, renderError } from '@/lib/utils';
import { extractOk } from '@/lib/api';

type UserContextType = {
  user: UserProfile | null;
  fetchUser: () => Promise<void>;
  isCurrentUserAdmin: boolean;
  isCurrentUserScanner: boolean;
  isCurrentUserUnassigned: boolean;
};

const UserContext = createContext<UserContextType>({
  user: null,
  fetchUser: () => Promise.reject(),
  isCurrentUserAdmin: false,
  isCurrentUserScanner: false,
  isCurrentUserUnassigned: false,
});

type UserProviderProps = {
  children: React.ReactNode;
};

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { actor } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const fetchUser = useCallback(async () => {
    await actor
      ?.get_my_user_profile()
      .then(extractOk)
      .then(setUser)
      .catch((e: Err) => {
        const title = 'Error fetching user';
        console.error(title, e);
        toast({
          title,
          description: renderError(e),
          variant: 'destructive',
        });
      });
  }, [actor, toast]);

  useEffect(() => {
    const showErrorToast = (resErr: Err, title: string) => {
      console.error(title, resErr);
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
        // the user's profile does not exist yet
        if (isCreatingUser) {
          // we are already creating the user
          // avoid creating the user twice
          return;
        }
        setIsCreatingUser(true);
        actor.create_my_user_profile().then(res => {
          if ('ok' in res) {
            setUser(res.ok);
            setIsCreatingUser(false);
          } else {
            showErrorToast(res.err, 'Error creating user');
          }
        });
      } else {
        showErrorToast(res.err, 'Error getting user');
      }
    });
  }, [actor, toast, isCreatingUser]);

  if (!user) {
    // TODO: show a loading state
    return null;
  }

  return (
    <UserContext.Provider
      value={{
        user,
        fetchUser,
        isCurrentUserAdmin: user ? enumKey(user.role) === 'admin' : false,
        isCurrentUserScanner: user ? enumKey(user.role) === 'scanner' : false,
        isCurrentUserUnassigned: user
          ? enumKey(user.role) === 'unassigned'
          : false,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => useContext(UserContext);
