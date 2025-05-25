import type {
  CustomDomainRecord,
  Err,
} from '@/declarations/backend/backend.did';
import { useAuth } from '@/hooks/use-auth';
import { extractOk } from '@/lib/api';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

type UseCustomDomainRecordsReturnType = UseQueryResult<
  Array<CustomDomainRecord>,
  Err
>;

export function useCustomDomainRecords(): UseCustomDomainRecordsReturnType {
  const { actor } = useAuth();

  return useQuery({
    queryKey: ['custom-domain-records'],
    queryFn: async () => {
      return await actor!.list_custom_domain_records().then(extractOk);
    },
    enabled: !!actor,
    meta: {
      errorMessage: 'Error fetching custom domain records',
    },
  });
}
