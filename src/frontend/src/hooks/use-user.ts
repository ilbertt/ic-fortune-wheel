'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Err, UserProfile } from '@/declarations/backend/backend.did';
import { useAuth } from '@/contexts/auth-context';
import { enumKey, toastError } from '@/lib/utils';
import { extractOk } from '@/lib/api';

type UseUserData = {
  user: UserProfile | null;
  isCurrentUserAdmin: boolean;
  isCurrentUserScanner: boolean;
  isCurrentUserUnassigned: boolean;
};

export function useUser(): UseUserData {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  const createUserMutation = useMutation<UserProfile, Err>({
    mutationFn: async () => {
      return actor!.create_my_user_profile().then(extractOk);
    },
    onSuccess: newUser => {
      queryClient.setQueryData<UserProfile>(['user'], newUser);
    },
    onError: error => toastError(error, 'Error creating user profile'),
  });

  const { data: user } = useQuery<UserProfile, Err>({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        return await actor!.get_my_user_profile().then(extractOk);
      } catch (err) {
        const error = err as Err;
        // If user doesn't exist, create a new profile
        if (error.code === 404) {
          return await createUserMutation.mutateAsync();
        }
        throw error;
      }
    },
    enabled: !!actor,
    meta: {
      errorMessage: 'Error fetching user profile',
    },
  });

  return {
    user: user ?? null,
    isCurrentUserAdmin: user ? enumKey(user.role) === 'admin' : false,
    isCurrentUserScanner: user ? enumKey(user.role) === 'scanner' : false,
    isCurrentUserUnassigned: user ? enumKey(user.role) === 'unassigned' : false,
  };
}
