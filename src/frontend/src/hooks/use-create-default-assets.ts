import { useAuth } from '@/hooks/use-auth';
import { extractOk } from '@/lib/api';
import { toastError } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to create default wheel assets (ICP, ckBTC, ckETH, ckUSDC)
 * @returns Mutation object for creating default assets
 */
export const useCreateDefaultAssets = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return actor!.set_default_wheel_assets().then(extractOk);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wheel-assets'] });
    },
    onError: err => toastError(err, 'Error creating default wheel assets'),
  });
};
