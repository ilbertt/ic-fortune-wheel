import { useAuth } from '@/contexts/auth-context';
import { extractOk } from '@/lib/api';
import { toastError } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type UpdateMyUserParams = {
  username: string;
};

export const useUpdateMyUser = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username }: UpdateMyUserParams) => {
      const result = await actor?.update_my_user_profile({
        username: [username],
      });
      return extractOk(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: e => toastError(e, 'Error updating user'),
  });
};
