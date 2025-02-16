import type { WheelPrizeExtractionState } from '@/declarations/backend/backend.did';

export const isWheelPrizeExtractionCompleted = (
  state: WheelPrizeExtractionState,
): state is Extract<WheelPrizeExtractionState, { completed: unknown }> => {
  return 'completed' in state;
};
