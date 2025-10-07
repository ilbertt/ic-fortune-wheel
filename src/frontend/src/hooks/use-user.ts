import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserRole, type UserProfile } from '@/lib/api/backend/backend';
import { useAuth } from '@/hooks/use-auth';
import { toastError } from '@/lib/utils';
import { extractOk } from '@/lib/api';

export type UseUserReturn = {
  user:
    | (UserProfile & {
        isAdmin: boolean;
        isScanner: boolean;
        isUnassigned: boolean;
      })
    | null;
};

const mapUser = (user: UserProfile): UseUserReturn['user'] => {
  return {
    ...user,
    isAdmin: user.role === UserRole.admin,
    isScanner: user.role === UserRole.scanner,
    isUnassigned: user.role === UserRole.unassigned,
  };
};

export function useUser(): UseUserReturn {
  const { actor, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async () => {
      return actor.create_my_user_profile().then(extractOk);
    },
    onSuccess: newUser => {
      queryClient.setQueryData<UserProfile>(['user'], newUser);
    },
    onError: error => toastError(error, 'Error creating user profile'),
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await actor.get_my_user_profile();
      if (res.__kind__ === 'ok') {
        return res.ok;
      } else if (res.err.code === 404) {
        return createUserMutation.mutateAsync();
      } else {
        throw res.err;
      }
    },
    enabled: isAuthenticated,
    select: mapUser,
    meta: {
      errorMessage: 'Error fetching user profile',
    },
  });

  return {
    user: user ?? null,
  };
}
