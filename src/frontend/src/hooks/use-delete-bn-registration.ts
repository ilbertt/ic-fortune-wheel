import type { Err } from '@/declarations/backend/backend.did';
import {
  deleteBnRegistration,
  type DeleteBnRegistrationRequestParams,
} from '@/lib/bn-registration';
import { toastError } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useDeleteBnRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Err, DeleteBnRegistrationRequestParams>({
    mutationFn: async params => {
      return await deleteBnRegistration(params);
    },
    onSuccess: (_, params) => {
      queryClient.removeQueries({
        queryKey: ['bn-registration', params.requestId],
      });
    },
    onError: err => {
      toastError(err, 'Error deleting BN domain');
    },
  });
};
