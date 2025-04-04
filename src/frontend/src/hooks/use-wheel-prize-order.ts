import { useAuth } from '@/hooks/use-auth';
import { extractOk } from '@/lib/api';
import { toastError } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useWheelPrizeOrder = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wheelAssetIds: string[]) => {
      return actor!
        .update_wheel_prizes_order({
          wheel_asset_ids: wheelAssetIds,
        })
        .then(extractOk);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wheel-prizes'] });
    },
    onError: err => toastError(err, 'Error updating prize order'),
  });
};
