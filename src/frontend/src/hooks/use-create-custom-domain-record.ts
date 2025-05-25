import type { CreateCustomDomainRecordRequest } from '@/declarations/backend/backend.did';
import { useAuth } from '@/hooks/use-auth';
import { extractOk } from '@/lib/api';
import { toastError } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useCreateCustomDomainRecord = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateCustomDomainRecordRequest) => {
      return await actor!.create_custom_domain_record(params).then(extractOk);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-domain-records'] });
    },
    onError: err => toastError(err, 'Error creating custom domain record'),
  });
};
