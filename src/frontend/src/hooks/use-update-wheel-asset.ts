import { useAuth } from '@/hooks/use-auth';
import { extractOk } from '@/lib/api';
import { toastError } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateWheelAssetRequest, Err } from '@/lib/api/backend/backend';

export const useUpdateWheelAsset = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<null, Err, UpdateWheelAssetRequest>({
    mutationFn: async args => {
      return actor.update_wheel_asset(args).then(extractOk);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wheel-assets'] });
    },
    onError: err => toastError(err, 'Error updating wheel asset'),
  });
};
