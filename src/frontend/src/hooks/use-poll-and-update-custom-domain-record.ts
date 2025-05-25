import { getBnRegistration } from '@/lib/bn-registration';
import { useQuery } from '@tanstack/react-query';
import { useUpdateCustomDomainRecord } from '@/hooks/use-update-custom-domain-record';
import type { CustomDomainRecord } from '@/declarations/backend/backend.did';
import { bnRegistrationIdFromBnRegistrationState } from '@/lib/custom-domain-record';

const POLL_INTERVAL_MS = 10_000;

type UsePollAndUpdateCustomDomainRecordParams = {
  record: CustomDomainRecord;
  enabled: boolean;
};

export const usePollAndUpdateCustomDomainRecord = ({
  record,
  enabled,
}: UsePollAndUpdateCustomDomainRecordParams) => {
  const bnRegistrationId = bnRegistrationIdFromBnRegistrationState(
    record.bn_registration_state,
  );
  const { mutateAsync: updateCustomDomainRecord } =
    useUpdateCustomDomainRecord();

  return useQuery({
    queryKey: bnRegistrationId
      ? ['bn-registration', bnRegistrationId]
      : ['bn-registration'],
    queryFn: async () => {
      const bnRegistration = await getBnRegistration({
        requestId: bnRegistrationId!,
      });
      if (bnRegistration.state === 'Available') {
        await updateCustomDomainRecord({
          id: record.id,
          bn_registration_state: {
            registered: { bn_registration_id: bnRegistrationId! },
          },
        });
      } else if (
        typeof bnRegistration.state !== 'string' ||
        bnRegistration.state === 'Failed'
      ) {
        const errorMessage =
          typeof bnRegistration.state !== 'string' &&
          'Failed' in bnRegistration.state
            ? bnRegistration.state.Failed
            : 'Unknown error';
        await updateCustomDomainRecord({
          id: record.id,
          bn_registration_state: {
            failed: {
              bn_registration_id: bnRegistrationId!,
              error_message: errorMessage,
            },
          },
        });
      } else {
        await updateCustomDomainRecord({
          id: record.id,
          bn_registration_state: {
            pending: { bn_registration_id: bnRegistrationId! },
          },
        });
      }
      return bnRegistration;
    },
    enabled: enabled && !!bnRegistrationId,
    refetchInterval: POLL_INTERVAL_MS,
  });
};
