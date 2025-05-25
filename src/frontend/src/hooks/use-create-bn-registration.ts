import type { Err } from '@/declarations/backend/backend.did';
import {
  createBnRegistration,
  type CreateBnRegistrationRequestParams,
  type CreateBnRegistrationResponse,
} from '@/lib/bn-registration';
import { toastError } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useCreateBnRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CreateBnRegistrationResponse,
    Err,
    CreateBnRegistrationRequestParams
  >({
    mutationFn: async params => {
      return await createBnRegistration(params);
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['bn-registration', data.id] });
    },
    onError: err => {
      toastError(err, 'Error registering BN domain');
    },
  });
};
