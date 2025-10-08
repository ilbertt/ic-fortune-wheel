import { useAuth } from '@/hooks/use-auth';
import type { Err, UpdateUserProfileRequest } from '@/lib/api/backend/backend';
import { extractOk } from '@/lib/api';
import { toastError } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateUser = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<null, Err, UpdateUserProfileRequest>({
    mutationFn: async args => {
      const result = await actor.update_user_profile(args);
      return extractOk(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: e => toastError(e, 'Error updating user'),
  });
};
