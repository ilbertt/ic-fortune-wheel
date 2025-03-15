import type { WheelPrize } from '@/declarations/backend/backend.did';
import { useMemo } from 'react';

type UseWheelPrizesProbabilityParams<T extends WheelPrize> = {
  prizes: T[];
};

type UseWheelPrizesProbabilityReturn = Array<
  WheelPrize & {
    drawProbability: number;
  }
>;

export const useWheelPrizesWithProbability = <T extends WheelPrize>({
  prizes,
}: UseWheelPrizesProbabilityParams<T>): UseWheelPrizesProbabilityReturn =>
  useMemo(() => {
    return prizes
      .reduce(
        (acc, prize) => {
          const prizeCount = acc.prizesCount.get(prize.wheel_asset_id) || 0;
          const newCount = prizeCount + 1;
          acc.prizesWithProbability.set(prize.wheel_asset_id, {
            ...prize,
            drawProbability: newCount / prizes.length,
          });
          acc.prizesCount.set(prize.wheel_asset_id, newCount);
          return acc;
        },
        { prizesWithProbability: new Map(), prizesCount: new Map() } as {
          prizesWithProbability: Map<
            string,
            WheelPrize & { drawProbability: number }
          >;
          prizesCount: Map<string, number>;
        },
      )
      .prizesWithProbability.values()
      .toArray()
      .sort((a, b) => b.drawProbability - a.drawProbability);
  }, [prizes]);
