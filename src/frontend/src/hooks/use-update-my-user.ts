import { useAuth } from '@/hooks/use-auth';
import { extractOk } from '@/lib/api';
import type {
  Err,
  UpdateMyUserProfileRequest,
} from '@/lib/api/backend/backend';
import { toastError } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateMyUser = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<null, Err, UpdateMyUserProfileRequest>({
    mutationFn: async (args: UpdateMyUserProfileRequest) => {
      const result = await actor.update_my_user_profile(args);
      return extractOk(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: e => toastError(e, 'Error updating user'),
  });
};
