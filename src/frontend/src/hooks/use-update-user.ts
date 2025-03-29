import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/declarations/backend/backend.did';
import { extractOk } from '@/lib/api';
import type { ExtractKeysFromCandidEnum } from '@/lib/types/utils';
import { candidOpt, toastError, toCandidEnum } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type UpdateUserParams = {
  userId: string;
  username?: string;
  role?: ExtractKeysFromCandidEnum<UserRole>;
};

export const useUpdateUser = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role, username }: UpdateUserParams) => {
      const result = await actor?.update_user_profile({
        user_id: userId,
        username: candidOpt(username),
        role: role ? [toCandidEnum(role)] : [],
      });
      return extractOk(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: e => toastError(e, 'Error updating user'),
  });
};
