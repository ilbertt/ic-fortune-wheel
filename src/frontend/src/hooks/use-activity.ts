import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type {
  Err,
  WheelPrizeExtraction,
} from '@/declarations/backend/backend.did';
import { useAuth } from '@/contexts/auth-context';
import { extractOk } from '@/lib/api';
import { useUser } from '@/hooks/use-user';

const FETCH_ACTIVITY_INTERVAL_MS = 2_000;

type ActivityData = WheelPrizeExtraction[];

export function useActivity(): UseQueryResult<ActivityData, Err> {
  const { actor } = useAuth();
  const { isCurrentUserAdmin } = useUser();

  return useQuery<ActivityData, Err>({
    queryKey: ['activity'],
    queryFn: async () => {
      return await actor!.list_wheel_prize_extractions().then(extractOk);
    },
    enabled: !!actor && isCurrentUserAdmin,
    meta: {
      errorMessage: 'Error fetching activity',
    },
    refetchInterval: FETCH_ACTIVITY_INTERVAL_MS,
  });
}
