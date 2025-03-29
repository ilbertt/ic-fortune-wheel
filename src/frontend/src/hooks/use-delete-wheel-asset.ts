import { useAuth } from '@/contexts/auth-context';
import type { Err } from '@/declarations/backend/backend.did';
import { extractOk } from '@/lib/api';
import { toastError } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useDeleteWheelAsset = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      const result = await actor?.delete_wheel_asset({ id: assetId });
      return extractOk(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wheel-assets'] });
    },
    onError: (e: Err) => toastError(e, 'Error deleting asset'),
  });
};
