import { toastError } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { extractOk } from '@/lib/api';

export const useRefreshTokenAssets = () => {
  const { actor } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user || !user.isAdmin) {
        return;
      }
      await actor!
        .fetch_tokens_data()
        .then(extractOk)
        // wait for the backend to update the tokens
        .then(() => new Promise(resolve => setTimeout(resolve, 10_000)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wheel-assets'] });
    },
    onError: err => toastError(err, 'Error refreshing tokens'),
  });
};
