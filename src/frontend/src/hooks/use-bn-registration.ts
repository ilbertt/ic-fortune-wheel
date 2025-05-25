import { Err } from '@/declarations/backend/backend.did';
import {
  type GetBnRegistrationResponse,
  getBnRegistration,
  type GetBnRegistrationRequestParams,
} from '@/lib/bn-registration';
import { useQuery } from '@tanstack/react-query';

export const useBnRegistration = ({
  requestId,
}: GetBnRegistrationRequestParams) => {
  return useQuery<GetBnRegistrationResponse, Err>({
    queryKey: ['bn-registration', requestId],
    queryFn: () => getBnRegistration({ requestId }),
    enabled: !!requestId,
    meta: {
      errorMessage: 'Error fetching BN registration',
    },
  });
};
