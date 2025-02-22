import { useAuth } from '@/contexts/auth-context';
import { extractOk } from '@/lib/api';
import { toastError } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type UseDeleteUserReturn = {
  deleteUser: (userId: string) => void;
  isDeleting: boolean;
};

export const useDeleteUser = (): UseDeleteUserReturn => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await actor?.delete_user_profile({ user_id: userId });
      return extractOk(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: e => toastError(e, 'Error deleting user'),
  });

  return {
    deleteUser: mutation.mutate,
    isDeleting: mutation.isPending,
  };
};
