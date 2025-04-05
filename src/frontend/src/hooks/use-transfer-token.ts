import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import type { TransferTokenRequest } from '@/declarations/backend/backend.did';
import { extractOk } from '@/lib/api';
import { toastError } from '@/lib/utils';
import { useRefreshTokenAssets } from '@/hooks/use-refresh-token-assets';

export type TransferTokenParams = TransferTokenRequest;

export const useTransferToken = () => {
  const { actor } = useAuth();
  const { mutateAsync: refreshTokenAssets } = useRefreshTokenAssets();

  return useMutation({
    mutationFn: async (params: TransferTokenParams) => {
      const result = await actor.transfer_token(params);
      const mappedResult = extractOk(result);
      await refreshTokenAssets();
      return mappedResult;
    },
    onError: err => toastError(err, 'Error transferring token'),
  });
};
