import { useAuth } from '@/contexts/auth-context';
import { extractOk } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WheelPrize } from '@/declarations/backend/backend.did';
import { useWheelPrizeOrder } from '@/hooks/use-wheel-prize-order';
import { useUpdateWheelAsset } from '@/hooks/use-update-wheel-asset';
import { atom, Provider, useAtom } from 'jotai';
import { toastError } from '@/lib/utils';

const FETCH_WHEEL_PRIZES_INTERVAL_MS = 10_000;

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

type OrderedWheelPrize = WheelPrize & {
  uniqueIndex: number;
};

const wheelPrizeWithUniqueIndex = (prize: WheelPrize): OrderedWheelPrize => ({
  ...prize,
  uniqueIndex: Math.random(),
});

type WheelPrizesAtomValue = {
  orderedPrizes: OrderedWheelPrize[];
  isDirty: boolean;
};

const mapWheelPrizesResponseToWheelPrizesAtom = (
  prizes: WheelPrize[],
): WheelPrizesAtomValue => {
  return prizes.reduce(
    (acc, prize) => {
      acc.orderedPrizes.push(wheelPrizeWithUniqueIndex(prize));
      return acc;
    },
    {
      orderedPrizes: [],
      isDirty: false,
    } as WheelPrizesAtomValue,
  );
};

type CurrentPrizeAtomValue = {
  prize: WheelPrize;
  index: number;
} | null;

const wheelPrizesAtom = atom<WheelPrizesAtomValue>({
  orderedPrizes: [],
  isDirty: false,
});
const currentPrizeAtom = atom<CurrentPrizeAtomValue>(null);
const wheelModalAtomOpen = atom<boolean>(false);

type UseWheelPrizesReturnType = {
  orderedPrizes: OrderedWheelPrize[];
  isDirty: boolean;
  updatePrize: (prize: WheelPrize) => void;
  updatePrizesOrder: (orderedPrizes: OrderedWheelPrize[]) => void;
  duplicatePrizeInOrder: (index: number) => void;
  removePrizeFromOrder: (index: number) => void;
  savePrizes: () => Promise<void>;
  savingPrizes: boolean;
  resetChanges: () => void;
  fetchWheelPrizes: () => void;
  isWheelPrizesFetching: boolean;
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
  const queryClient = useQueryClient();

  const { mutateAsync: savePrizes, isPending: savingPrizes } = useMutation({
    mutationFn: async () => {
      if (!wheelPrizes.isDirty) {
        return;
      }

      const promises = [];

      const orderedPrizesIds = wheelPrizes.orderedPrizes.map(
        prize => prize.wheel_asset_id,
      );

      // if the order has changed, update it
      if (
        !orderedPrizesIds.every((prizeId, index) => {
          const originalIndex = fetchedPrizes.findIndex(
            (p: WheelPrize) => p.wheel_asset_id === prizeId,
          );
          return index === originalIndex;
        })
      ) {
        promises.push(updateOrderMutation.mutateAsync(orderedPrizesIds));
      }

      // for each dirty prize, update the asset if its settings have changed
      for (const fetchedPrize of fetchedPrizes) {
        const dirtyPrize = wheelPrizes.orderedPrizes.find(
          item => item.wheel_asset_id === fetchedPrize.wheel_asset_id,
        );

        if (dirtyPrize && hasWheelPrizeChanged(fetchedPrize, dirtyPrize)) {
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
      queryClient.invalidateQueries({ queryKey: ['wheel-prizes'] });
    },
    onError: e => toastError(e, 'Error saving prizes'),
  });

  // Query to fetch wheel prizes
  const {
    data: fetchedPrizes = [],
    refetch: fetchWheelPrizes,
    isLoading: isWheelPrizesFetching,
  } = useQuery<WheelPrize[]>({
    queryKey: ['wheel-prizes'],
    queryFn: async () => {
      const res = await actor!.list_wheel_prizes().then(extractOk);
      setWheelPrizes(prev => {
        if (prev.isDirty || prev.orderedPrizes.length === res.length) {
          // If there are changes, don't update the prizes.
          // This will likely return an error when saving the prizes,
          // as some of the dirty prizes may not be enabled anymore.
          return prev;
        } else {
          return mapWheelPrizesResponseToWheelPrizesAtom(res);
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

  const updatePrize = (prize: WheelPrize) => {
    setWheelPrizes(prev => {
      const updatedOrderedPrizes = [...prev.orderedPrizes];
      for (let i = 0; i < updatedOrderedPrizes.length; i++) {
        const existingPrize = updatedOrderedPrizes[i];
        if (existingPrize.wheel_asset_id === prize.wheel_asset_id) {
          updatedOrderedPrizes[i] = {
            ...existingPrize,
            ...prize,
            uniqueIndex: existingPrize.uniqueIndex,
          };
        }
      }
      return { ...prev, orderedPrizes: updatedOrderedPrizes, isDirty: true };
    });
  };

  const updatePrizesOrder = (orderedPrizes: OrderedWheelPrize[]) => {
    setWheelPrizes(prev => ({ ...prev, orderedPrizes, isDirty: true }));
  };

  const duplicatePrizeInOrder = (index: number) => {
    const newPrizesOrder = [...wheelPrizes.orderedPrizes];
    newPrizesOrder.splice(
      index + 1,
      0,
      wheelPrizeWithUniqueIndex(newPrizesOrder[index]),
    );
    updatePrizesOrder(newPrizesOrder);
  };

  const removePrizeFromOrder = (index: number) => {
    const newPrizesOrder = [...wheelPrizes.orderedPrizes];
    newPrizesOrder.splice(index, 1);
    updatePrizesOrder(newPrizesOrder);
  };

  const resetChanges = () => {
    setWheelPrizes(mapWheelPrizesResponseToWheelPrizesAtom(fetchedPrizes));
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
    orderedPrizes: wheelPrizes.orderedPrizes,
    isDirty: wheelPrizes.isDirty,
    updatePrize,
    updatePrizesOrder,
    duplicatePrizeInOrder,
    removePrizeFromOrder,
    savePrizes,
    savingPrizes,
    resetChanges,
    fetchWheelPrizes,
    isWheelPrizesFetching,
    currentPrize,
    spinPrizeByIndex,
    spinPrizeByWheelAssetId,
    stopSpinning,
    resetCurrentPrize,
    isModalOpen: wheelModalOpen,
  };
};
