import type { WheelPrize } from '@/declarations/backend/backend.did';
import { mapPrizesToWheelData } from '@/lib/wheel-prize';
import { useMemo } from 'react';
import { type WheelDataType } from 'react-custom-roulette';

type UseWheelDataParams<T extends WheelPrize> = {
  prizes: T[];
};

type UseWheelDataReturn = WheelDataType[];

export const useWheelData = <T extends WheelPrize>({
  prizes,
}: UseWheelDataParams<T>): UseWheelDataReturn =>
  useMemo(() => {
    return mapPrizesToWheelData(prizes);
  }, [prizes]);
