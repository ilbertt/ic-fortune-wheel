'use client';

import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { extractOk } from '@/lib/api';
import { renderError } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import type { WheelPrizeExtractionsStats } from '@/declarations/backend/backend.did';

type UseWheelPrizeExtractionsStatsOptions = {
  refreshIntervalMs: number;
};

export const useWheelPrizeExtractionsStats = (
  options: UseWheelPrizeExtractionsStatsOptions,
) => {
  const { refreshIntervalMs } = options;
  const { actor } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<WheelPrizeExtractionsStats | null>(null);
  const [fetchingStats, setFetchingStats] = useState(true);

  const fetchStats = useCallback(async () => {
    setFetchingStats(true);
    await actor
      ?.get_wheel_prize_extractions_stats()
      .then(extractOk)
      .then(setStats)
      .catch(e => {
        const title = 'Error fetching wheel prize extraction stats';
        console.error(title, e);
        toast({
          title,
          description: renderError(e),
          variant: 'destructive',
        });
      })
      .finally(() => setFetchingStats(false));
  }, [actor, toast]);

  useEffect(() => {
    fetchStats();

    if (refreshIntervalMs) {
      const interval = setInterval(fetchStats, refreshIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchStats, refreshIntervalMs]);

  return {
    stats,
    fetchingStats,
    fetchStats,
  };
};
