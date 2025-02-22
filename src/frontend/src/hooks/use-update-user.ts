import { useAuth } from '@/contexts/auth-context';
import type { UserRole } from '@/declarations/backend/backend.did';
import { extractOk } from '@/lib/api';
import type { ExtractKeysFromCandidEnum } from '@/lib/types/utils';
import { toastError, toCandidEnum } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type UpdateUserParams = {
  userId: string;
  role: ExtractKeysFromCandidEnum<UserRole>;
};

type UseUpdateUserReturn = {
  updateUser: (params: UpdateUserParams) => void;
  isUpdating: boolean;
};

export const useUpdateUser = (): UseUpdateUserReturn => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ userId, role }: UpdateUserParams) => {
      const result = await actor?.update_user_profile({
        user_id: userId,
        username: [],
        role: [toCandidEnum(role)],
      });
      return extractOk(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: e => toastError(e, 'Error updating user'),
  });

  return {
    updateUser: mutation.mutate,
    isUpdating: mutation.isPending,
  };
};
