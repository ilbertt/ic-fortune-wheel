import { useAuth } from '@/contexts/auth-context';
import { type Err } from '@/declarations/backend/backend.did';
import { extractOk } from '@/lib/api';
import { toastError } from '@/lib/utils';
import {
  useMutation,
  useQueryClient,
  type UseMutateFunction,
} from '@tanstack/react-query';

type UpdateMyUserParams = {
  username: string;
};

type UseUpdateMyUserReturn = {
  updateMyUser: UseMutateFunction<null, Err, UpdateMyUserParams, unknown>;
  isUpdating: boolean;
};

export const useUpdateMyUser = (): UseUpdateMyUserReturn => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
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

  return {
    updateMyUser: mutation.mutate,
    isUpdating: mutation.isPending,
  };
};
