import { useAuth } from '@/hooks/use-auth';
import { extractOk } from '@/lib/api';
import { toastError } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDeleteBnRegistration } from '@/hooks/use-delete-bn-registration';

export const useDeleteCustomDomainRecord = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();
  const { mutateAsync: deleteBnRegistration } = useDeleteBnRegistration();

  return useMutation({
    mutationFn: async ({
      recordId,
      bnRegistrationId,
    }: {
      recordId: string;
      bnRegistrationId?: string;
    }) => {
      const res = await actor!
        .delete_custom_domain_record({ id: recordId })
        .then(extractOk);

      if (bnRegistrationId) {
        await deleteBnRegistration({ requestId: bnRegistrationId });
      }

      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-domain-records'] });
    },
    onError: e => toastError(e, 'Error deleting custom domain record'),
  });
};
