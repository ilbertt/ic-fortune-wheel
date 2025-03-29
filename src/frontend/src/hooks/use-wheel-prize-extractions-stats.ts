import { useAuth } from '@/hooks/use-auth';
import { extractOk } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { WheelPrizeExtractionsStats } from '@/declarations/backend/backend.did';

const FETCH_WHEEL_PRIZE_EXTRACTIONS_INTERVAL_MS = 2_000;

type UseWheelPrizeExtractionsStatsReturnType = {
  stats: WheelPrizeExtractionsStats | undefined;
};

export const useWheelPrizeExtractionsStats =
  (): UseWheelPrizeExtractionsStatsReturnType => {
    const { actor } = useAuth();

    const { data: stats } = useQuery<WheelPrizeExtractionsStats>({
      queryKey: ['wheel-prize-extractions-stats'],
      queryFn: async () => {
        return actor!.get_wheel_prize_extractions_stats().then(extractOk);
      },
      enabled: !!actor,
      refetchInterval: FETCH_WHEEL_PRIZE_EXTRACTIONS_INTERVAL_MS,
    });

    return {
      stats,
    };
  };
