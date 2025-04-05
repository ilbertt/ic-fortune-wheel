import { useAuth } from '@/hooks/use-auth';
import type { WheelAsset } from '@/declarations/backend/backend.did';
import { extractOk } from '@/lib/api';
import { useUser } from '@/hooks/use-user';
import { useQuery } from '@tanstack/react-query';

type UseWheelAssetsReturnType<T> = {
  data: T | undefined;
  fetchingAssets: boolean;
};

export const useWheelAssets = <T>(
  select?: (data: Array<WheelAsset>) => T,
): UseWheelAssetsReturnType<T> => {
  const { actor } = useAuth();
  const { isCurrentUserAdmin } = useUser();

  // Query to fetch wheel assets with proper typing and transformation
  const { data, isLoading: fetchingAssets } = useQuery({
    queryKey: ['wheel-assets'],
    queryFn: async () => {
      const response = await actor!.list_wheel_assets({ state: [] });
      return extractOk(response);
    },
    enabled: !!actor && isCurrentUserAdmin,
    select: select,
    meta: {
      errorMessage: 'Error fetching assets',
    },
  });

  return {
    data,
    fetchingAssets,
  };
};
