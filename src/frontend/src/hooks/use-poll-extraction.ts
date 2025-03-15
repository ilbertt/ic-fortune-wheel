'use client';

import { useAuth } from '@/contexts/auth-context';
import { useWheelPrizes } from '@/hooks/use-wheel-prizes';
import { useQuery } from '@tanstack/react-query';
import { extractOk } from '@/lib/api';
import { isWheelPrizeExtractionCompleted } from '@/lib/wheel-prize-extraction';
import { useRef } from 'react';

const LAST_EXTRACTION_POLLING_INTERVAL_MS = 1_500;

export const usePollExtraction = () => {
  const { actor } = useAuth();
  const { orderedPrizes, spinPrizeByWheelAssetId } = useWheelPrizes();
  const hasPrizes = orderedPrizes.length > 0;
  const lastExtractionIdRef = useRef<string | null>(null);

  useQuery({
    queryKey: ['last-wheel-prize-extraction'],
    queryFn: async () => {
      if (!hasPrizes) {
        return null;
      }

      // eslint-disable-next-line no-console
      console.log('FORTUNE WHEEL: Polling extraction...');

      const res = await actor!
        .get_last_wheel_prize_extraction()
        .then(extractOk);
      const newExtraction = res[0];

      if (
        newExtraction &&
        newExtraction.id !== lastExtractionIdRef.current &&
        isWheelPrizeExtractionCompleted(newExtraction.state) &&
        newExtraction.wheel_asset_id[0]
      ) {
        spinPrizeByWheelAssetId(newExtraction.wheel_asset_id[0]);
        lastExtractionIdRef.current = newExtraction.id;
        // eslint-disable-next-line no-console
        console.log(
          'FORTUNE WHEEL: Polling completed: Found new prize',
          newExtraction,
        );
      } else {
        // eslint-disable-next-line no-console
        console.log('FORTUNE WHEEL: Polling completed: No new prize');
      }

      return newExtraction || null;
    },
    enabled: !!actor && hasPrizes,
    refetchInterval: LAST_EXTRACTION_POLLING_INTERVAL_MS,
    // Do not notify on any changes, so that we don't re-render the component
    // at every polling iteration
    notifyOnChangeProps: [],
    meta: {
      errorMessage: 'Error polling for wheel prize extraction',
    },
  });
};
