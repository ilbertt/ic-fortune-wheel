import { useAuth } from '@/hooks/use-auth';
import { extractOk } from '@/lib/api';
import { toastError } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateWheelAssetRequest,
  Err,
  WheelAsset,
} from '@/lib/api/backend/backend';

export const useCreateWheelAsset = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<WheelAsset, Err, CreateWheelAssetRequest>({
    mutationFn: async args => {
      return actor.create_wheel_asset(args).then(extractOk);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wheel-assets'] });
    },
    onError: err => toastError(err, 'Error creating wheel asset'),
  });
};
