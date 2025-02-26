'use client';

import type {
  Err,
  WheelPrizeExtraction,
} from '@/declarations/backend/backend.did';
import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
} from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { extractOk } from '@/lib/api';
import { renderError } from '@/lib/utils';
import { useUser } from '@/contexts/user-context';

type ActivityContextType = {
  activity: WheelPrizeExtraction[];
  fetchActivity: () => Promise<void>;
  fetchingActivity: boolean;
};

const ActivityContext = createContext<ActivityContextType>({
  activity: [],
  fetchActivity: () => Promise.reject(),
  fetchingActivity: false,
});

type ActivityProviderProps = {
  refreshIntervalMs: number;
  children: React.ReactNode;
};

export const ActivityProvider: React.FC<ActivityProviderProps> = ({
  refreshIntervalMs,
  children,
}) => {
  const { actor } = useAuth();
  const { isCurrentUserAdmin } = useUser();
  const [activity, setActivity] = useState<WheelPrizeExtraction[]>([]);
  const [fetchingActivity, setFetchingActivity] = useState(false);
  const { toast } = useToast();

  const fetchActivity = useCallback(async () => {
    if (!isCurrentUserAdmin) {
      return;
    }
    setFetchingActivity(true);
    await actor
      ?.list_wheel_prize_extractions()
      .then(extractOk)
      .then(extractions => setActivity(extractions))
      .catch((e: Err) => {
        const title = 'Error fetching activity';
        console.error(title, e);
        toast({
          title,
          description: renderError(e),
          variant: 'destructive',
        });
      })
      .finally(() => setFetchingActivity(false));
  }, [actor, toast, isCurrentUserAdmin]);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [fetchActivity, refreshIntervalMs]);

  return (
    <ActivityContext.Provider
      value={{
        activity,
        fetchActivity,
        fetchingActivity,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => useContext(ActivityContext);
