import type { WheelPrizeExtractionState } from '@/lib/api/backend/backend';

export const isWheelPrizeExtractionCompleted = (
  state: WheelPrizeExtractionState,
): state is Extract<WheelPrizeExtractionState, { __kind__: 'completed' }> => {
  return state.__kind__ === 'completed';
};
