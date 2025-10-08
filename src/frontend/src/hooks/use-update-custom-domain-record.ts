import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import type {
  Err,
  UpdateCustomDomainRecordRequest,
} from '@/lib/api/backend/backend';
import { toastError } from '@/lib/utils';
import { extractOk } from '@/lib/api';

export const useUpdateCustomDomainRecord = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<null, Err, UpdateCustomDomainRecordRequest>({
    mutationFn: async args => {
      return await actor.update_custom_domain_record(args).then(extractOk);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-domain-records'] });
    },
    onError: err => {
      toastError(err, 'Failed to update custom domain record');
    },
  });
};
