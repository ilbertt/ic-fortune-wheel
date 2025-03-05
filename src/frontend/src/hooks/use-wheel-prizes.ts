'use client';

import { useAuth } from '@/contexts/auth-context';
import { extractOk } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { WheelPrize, Err } from '@/declarations/backend/backend.did';
import { wheelAssetUrl } from '@/lib/wheel-asset';
import { type WheelDataType } from 'react-custom-roulette';
import { useState } from 'react';
import { useWheelPrizeOrder } from '@/hooks/use-wheel-prize-order';
import { useUpdateWheelPrize } from '@/hooks/use-update-wheel-prize';

const FETCH_WHEEL_PRIZES_INTERVAL_MS = 10_000;

const mapPrizesToWheelData = (prizes: WheelPrize[]): WheelDataType[] => {
  return prizes.map(item => {
    const imageUri = wheelAssetUrl(item.wheel_image_path);

    return {
      option: item.name,
      image: imageUri
        ? {
            uri: imageUri,
            sizeMultiplier: 0.8,
            offsetY: 180,
          }
        : undefined,
      style: {
        backgroundColor: item.wheel_ui_settings.background_color_hex,
      },
    };
  });
};

const hasWheelPrizeChanged = (
  existingPrize: WheelPrize,
  newPrize: WheelPrize,
) => {
  return (
    existingPrize.wheel_ui_settings.background_color_hex !==
    newPrize.wheel_ui_settings.background_color_hex
  );
};

type UseWheelPrizesReturnType = {
  prizes: WheelPrize[];
  setPrizes: (items: WheelPrize[]) => void;
  wheelData: WheelDataType[];
  isDirty: boolean;
  savePrizes: () => Promise<void>;
  resetChanges: () => void;
  fetchPrizes: () => Promise<void>;
  fetching: boolean;
  spinPrizeByIndex: (index: number) => void;
  spinPrizeByWheelAssetId: (id: string) => void;
  stopSpinning: () => void;
  currentPrize: {
    prize: WheelPrize;
    index: number;
  } | null;
  resetCurrentPrize: () => void;
  isModalOpen: boolean;
};

export const useWheelPrizes = (): UseWheelPrizesReturnType => {
  const { actor } = useAuth();
  const updateOrderMutation = useWheelPrizeOrder();
  const updateWheelPrize = useUpdateWheelPrize();
  const [dirtyPrizes, setDirtyPrizes] = useState<{
    prizes: WheelPrize[];
    isDirty: boolean;
  }>({ prizes: [], isDirty: false });
  const [currentPrize, setCurrentPrize] =
    useState<UseWheelPrizesReturnType['currentPrize']>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Query to fetch wheel prizes
  const {
    data: fetchedPrizes = [],
    refetch,
    isLoading: fetching,
  } = useQuery<WheelPrize[], Err>({
    queryKey: ['wheel-prizes'],
    queryFn: async () => {
      const res = await actor!.list_wheel_prizes().then(extractOk);
      setDirtyPrizes(prev => {
        if (prev.isDirty) {
          // Just replace each prize with the new one without changing the order
          // Remove prizes that are no longer in the response
          const newPrizes = prev.prizes
            .filter(prize =>
              res.some(p => p.wheel_asset_id === prize.wheel_asset_id),
            )
            .map(prize => {
              const newPrize = res.find(
                p => p.wheel_asset_id === prize.wheel_asset_id,
              );
              return newPrize || prize;
            });
          // Add new prizes to the end
          newPrizes.push(
            ...res.filter(
              prize =>
                !prev.prizes.some(
                  p => p.wheel_asset_id === prize.wheel_asset_id,
                ),
            ),
          );
          return { ...prev, prizes: newPrizes };
        }
        return { prizes: res, isDirty: false };
      });
      return res;
    },
    enabled: !!actor,
    refetchInterval: FETCH_WHEEL_PRIZES_INTERVAL_MS,
    meta: {
      errorMessage: 'Error fetching prizes',
    },
  });

  const setPrizes = (newPrizes: WheelPrize[]) => {
    setDirtyPrizes({ prizes: newPrizes, isDirty: true });
  };

  const savePrizes = async () => {
    if (!dirtyPrizes.isDirty) {
      return;
    }

    const promises = [];

    // if the order has changed, update it
    if (
      !dirtyPrizes.prizes.every((item, index) => {
        const originalIndex = fetchedPrizes.findIndex(
          (p: WheelPrize) => p.wheel_asset_id === item.wheel_asset_id,
        );
        return index === originalIndex;
      })
    ) {
      promises.push(
        updateOrderMutation.mutateAsync(
          dirtyPrizes.prizes.map(item => item.wheel_asset_id),
        ),
      );
    }

    // for each dirty prize, update the asset if its settings have changed
    for (const dirtyPrize of dirtyPrizes.prizes) {
      const existingPrize = fetchedPrizes.find(
        (item: WheelPrize) => item.wheel_asset_id === dirtyPrize.wheel_asset_id,
      );

      if (existingPrize && hasWheelPrizeChanged(existingPrize, dirtyPrize)) {
        promises.push(
          updateWheelPrize.mutateAsync({
            id: dirtyPrize.wheel_asset_id,
            wheel_ui_settings: dirtyPrize.wheel_ui_settings,
          }),
        );
      }
    }

    // The mutations already invalidate the query, so we don't need to refetch
    await Promise.all(promises);
    setDirtyPrizes(prev => ({ ...prev, isDirty: false }));
  };

  const resetChanges = () => {
    setDirtyPrizes({ prizes: fetchedPrizes, isDirty: false });
  };

  const fetchPrizes = async (): Promise<void> => {
    await refetch();
  };

  const spinPrizeByIndex = (index: number) => {
    const prize = fetchedPrizes[index];
    if (prize) {
      setCurrentPrize({ prize, index });
    }
  };

  const spinPrizeByWheelAssetId = (id: string) => {
    const prizeIndex = fetchedPrizes.findIndex(
      prize => prize.wheel_asset_id === id,
    );
    if (prizeIndex > -1) {
      setCurrentPrize({ prize: fetchedPrizes[prizeIndex], index: prizeIndex });
    }
  };

  const stopSpinning = () => {
    setIsModalOpen(true);
  };

  const resetCurrentPrize = () => {
    setIsModalOpen(false);
    setCurrentPrize(null);
  };

  return {
    prizes: dirtyPrizes.prizes,
    setPrizes,
    wheelData: mapPrizesToWheelData(dirtyPrizes.prizes),
    isDirty: dirtyPrizes.isDirty,
    savePrizes,
    resetChanges,
    fetchPrizes,
    fetching,
    spinPrizeByIndex,
    spinPrizeByWheelAssetId,
    stopSpinning,
    currentPrize,
    resetCurrentPrize,
    isModalOpen,
  };
};
