import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import type { TransferTokenRequest } from '@/declarations/backend/backend.did';
import { extractOk } from '@/lib/api';
import { useWheelAssetTokens } from '@/hooks/use-wheel-asset-tokens';
import { toastError } from '@/lib/utils';

export type TransferTokenParams = TransferTokenRequest;

export const useTransferToken = () => {
  const { actor } = useAuth();
  const { refreshTokenAssets } = useWheelAssetTokens();

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
