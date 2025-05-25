import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import type { UpdateCustomDomainRecordRequest } from '@/declarations/backend/backend.did';
import { toastError } from '@/lib/utils';
import { extractOk } from '@/lib/api';

export const useUpdateCustomDomainRecord = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateCustomDomainRecordRequest) => {
      return await actor!.update_custom_domain_record(params).then(extractOk);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-domain-records'] });
    },
    onError: err => {
      toastError(err, 'Failed to update custom domain record');
    },
  });
};
