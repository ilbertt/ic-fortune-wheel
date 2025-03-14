'use client';

import { useAuth } from '@/contexts/auth-context';
import { extractOk } from '@/lib/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { WheelPrize, Err } from '@/declarations/backend/backend.did';
import { wheelAssetUrl } from '@/lib/wheel-asset';
import { type WheelDataType } from 'react-custom-roulette';
import { useWheelPrizeOrder } from '@/hooks/use-wheel-prize-order';
import { useUpdateWheelAsset } from '@/hooks/use-update-wheel-asset';
import { atom, Provider, useAtom, useAtomValue } from 'jotai';

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

export const WheelPrizesProvider = Provider;

type WheelPrizesAtomValue = {
  prizes: WheelPrize[];
  isDirty: boolean;
};

type CurrentPrizeAtomValue = {
  prize: WheelPrize;
  index: number;
} | null;

const wheelPrizesAtom = atom<WheelPrizesAtomValue>({
  prizes: [],
  isDirty: false,
});
const wheelDataAtom = atom<WheelDataType[]>(get =>
  mapPrizesToWheelData(get(wheelPrizesAtom).prizes),
);
const currentPrizeAtom = atom<CurrentPrizeAtomValue>(null);
const wheelModalAtomOpen = atom<boolean>(false);

type UseWheelPrizesReturnType = WheelPrizesAtomValue & {
  setPrizes: (items: WheelPrize[]) => void;
  savePrizes: () => Promise<void>;
  savingPrizes: boolean;
  resetChanges: () => void;
  fetchPrizes: () => Promise<void>;
  fetching: boolean;
  spinPrizeByIndex: (index: number) => void;
  spinPrizeByWheelAssetId: (id: string) => void;
  stopSpinning: () => void;
  resetCurrentPrize: () => void;
  currentPrize: CurrentPrizeAtomValue;
  isModalOpen: boolean;
};

export const useWheelPrizes = (): UseWheelPrizesReturnType => {
  const { actor } = useAuth();
  const [wheelPrizes, setWheelPrizes] = useAtom(wheelPrizesAtom);
  const [currentPrize, setCurrentPrize] = useAtom(currentPrizeAtom);
  const [wheelModalOpen, setWheelModalOpen] = useAtom(wheelModalAtomOpen);
  const updateOrderMutation = useWheelPrizeOrder();
  const updateWheelAsset = useUpdateWheelAsset();

  const { mutateAsync: savePrizes, isPending: savingPrizes } = useMutation({
    mutationFn: async () => {
      if (!wheelPrizes.isDirty) {
        return;
      }

      const promises = [];

      // if the order has changed, update it
      if (
        !wheelPrizes.prizes.every((item, index) => {
          const originalIndex = fetchedPrizes.findIndex(
            (p: WheelPrize) => p.wheel_asset_id === item.wheel_asset_id,
          );
          return index === originalIndex;
        })
      ) {
        promises.push(
          updateOrderMutation.mutateAsync(
            wheelPrizes.prizes.map(item => item.wheel_asset_id),
          ),
        );
      }

      // for each dirty prize, update the asset if its settings have changed
      for (const dirtyPrize of wheelPrizes.prizes) {
        const existingPrize = fetchedPrizes.find(
          (item: WheelPrize) =>
            item.wheel_asset_id === dirtyPrize.wheel_asset_id,
        );

        if (existingPrize && hasWheelPrizeChanged(existingPrize, dirtyPrize)) {
          promises.push(
            updateWheelAsset.mutateAsync({
              id: dirtyPrize.wheel_asset_id,
              wheel_ui_settings: dirtyPrize.wheel_ui_settings,
            }),
          );
        }
      }

      // The mutations already invalidate the query, so we don't need to refetch
      await Promise.all(promises);
    },
    onSuccess: () => {
      setWheelPrizes(prev => ({ ...prev, isDirty: false }));
    },
  });

  // Query to fetch wheel prizes
  const {
    data: fetchedPrizes = [],
    refetch,
    isLoading: fetching,
  } = useQuery<WheelPrize[], Err>({
    queryKey: ['wheel-prizes'],
    queryFn: async () => {
      const res = await actor!.list_wheel_prizes().then(extractOk);
      setWheelPrizes(prev => {
        if (prev.isDirty) {
          // If there are changes, don't update the prizes.
          // This will likely return an error when saving the prizes,
          // as some of the dirty prizes may not be enabled anymore.
          return prev;
        } else if (prev.prizes.length > 0) {
          // Replace the prizes with the new ones
          // without changing the reference of the wheelPrizes array
          for (const prize of res) {
            const originalPrizeIndex = prev.prizes.findIndex(
              p => p.wheel_asset_id === prize.wheel_asset_id,
            );
            if (originalPrizeIndex > -1) {
              prev.prizes[originalPrizeIndex] = prize;
            }
          }
          return prev;
        } else {
          return { prizes: res, isDirty: false };
        }
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
    setWheelPrizes({ prizes: newPrizes, isDirty: true });
  };

  const resetChanges = () => {
    setWheelPrizes({
      prizes: fetchedPrizes,
      isDirty: false,
    });
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
    spinPrizeByIndex(prizeIndex);
  };

  const stopSpinning = () => {
    setWheelModalOpen(true);
  };

  const resetCurrentPrize = () => {
    setWheelModalOpen(false);
    setCurrentPrize(null);
  };

  return {
    prizes: wheelPrizes.prizes,
    isDirty: wheelPrizes.isDirty,
    setPrizes,
    savePrizes,
    savingPrizes,
    resetChanges,
    fetchPrizes,
    fetching,
    currentPrize,
    spinPrizeByIndex,
    spinPrizeByWheelAssetId,
    stopSpinning,
    resetCurrentPrize,
    isModalOpen: wheelModalOpen,
  };
};

export const useWheelPrizesMapped = (): WheelDataType[] =>
  useAtomValue(wheelDataAtom);
