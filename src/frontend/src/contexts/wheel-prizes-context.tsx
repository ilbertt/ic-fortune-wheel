'use client';

import type { Err, WheelPrize } from '@/declarations/backend/backend.did';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { type WheelDataType } from 'react-custom-roulette';
import { wheelAssetUrl } from '@/lib/wheel-asset';
import { useAuth } from '@/contexts/auth-context';
import { extractOk } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { renderError } from '@/lib/utils';

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

type WheelPrizesContextType = {
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

const WheelPrizesContext = createContext<WheelPrizesContextType>({
  prizes: [],
  setPrizes: () => {},
  wheelData: [],
  isDirty: false,
  savePrizes: () => Promise.reject(),
  resetChanges: () => {},
  fetchPrizes: () => Promise.reject(),
  fetching: false,
  spinPrizeByIndex: () => {},
  spinPrizeByWheelAssetId: () => {},
  stopSpinning: () => {},
  currentPrize: null,
  resetCurrentPrize: () => {},
  isModalOpen: false,
});

export const WheelPrizesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { actor } = useAuth();
  const [prizes, setPrizes] = useState<WheelPrize[]>([]);
  const [fetching, setFetching] = useState(false);
  const [dirtyPrizes, setDirtyPrizes] = useState<{
    prizes: WheelPrize[];
    isDirty: boolean;
  }>({ prizes: [], isDirty: false });
  const [wheelData, setWheelData] = useState<WheelDataType[]>([]);
  const { toast } = useToast();
  const [currentPrize, setCurrentPrize] =
    useState<WheelPrizesContextType['currentPrize']>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPrizes = useCallback(async () => {
    setFetching(true);
    actor
      ?.list_wheel_prizes()
      .then(extractOk)
      .then(newPrizes => {
        setPrizes(newPrizes);
        setDirtyPrizes({ prizes: newPrizes, isDirty: false });
        setWheelData(mapPrizesToWheelData(newPrizes));
      })
      .catch((e: Err) => {
        const title = 'Error fetching prizes';
        console.error(title, e);
        toast({
          title,
          description: renderError(e),
          variant: 'destructive',
        });
      })
      .finally(() => setFetching(false));
  }, [actor, toast]);

  const handleSetPrizes = useCallback((newPrizes: WheelPrize[]) => {
    setDirtyPrizes({ prizes: newPrizes, isDirty: true });
    setWheelData(mapPrizesToWheelData(newPrizes));
  }, []);

  const savePrizes = useCallback(async () => {
    if (!dirtyPrizes.isDirty) {
      return;
    }

    const promises = [];

    // if the order has changed, update it
    if (
      !dirtyPrizes.prizes.every((item, index) => index === prizes.indexOf(item))
    ) {
      promises.push(
        actor.update_wheel_prizes_order({
          wheel_asset_ids: dirtyPrizes.prizes.map(item => item.wheel_asset_id),
        }),
      );
    }

    // for each dirty prize, update the asset if its settings have changed
    for (const dirtyPrize of dirtyPrizes.prizes) {
      const existingPrize = prizes.find(
        item => item.wheel_asset_id === dirtyPrize.wheel_asset_id,
      )!;
      if (
        dirtyPrize.wheel_ui_settings.background_color_hex !==
        existingPrize.wheel_ui_settings.background_color_hex
      ) {
        promises.push(
          actor.update_wheel_asset({
            id: dirtyPrize.wheel_asset_id,
            wheel_ui_settings: [dirtyPrize.wheel_ui_settings],
            asset_type_config: [],
            name: [],
            total_amount: [],
            used_amount: [],
            state: [],
          }),
        );
      }
    }

    setFetching(true);
    Promise.all(promises.map(p => p.then(extractOk)))
      .then(fetchPrizes)
      .catch((e: Err) => {
        const title = 'Error saving prizes';
        console.error(title, e);
        toast({
          title,
          description: renderError(e),
          variant: 'destructive',
        });
      })
      .finally(() => setFetching(false));
  }, [actor, dirtyPrizes, fetchPrizes, toast, prizes]);

  const resetChanges = useCallback(() => {
    setDirtyPrizes({ prizes, isDirty: false });
    setWheelData(mapPrizesToWheelData(prizes));
  }, [prizes]);

  const spinPrizeByIndex = useCallback(
    (index: number) => {
      const prize = prizes[index];
      if (prize) {
        setCurrentPrize({ prize, index });
      }
    },
    [prizes],
  );

  const spinPrizeByWheelAssetId = useCallback(
    (id: string) => {
      const prizeIndex = prizes.findIndex(prize => prize.wheel_asset_id === id);
      if (prizeIndex > -1) {
        setCurrentPrize({ prize: prizes[prizeIndex], index: prizeIndex });
      }
    },
    [prizes],
  );

  const stopSpinning = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const resetCurrentPrize = useCallback(() => {
    setIsModalOpen(false);
    setCurrentPrize(null);
  }, []);

  useEffect(() => {
    fetchPrizes();
  }, [fetchPrizes]);

  return (
    <WheelPrizesContext.Provider
      value={{
        prizes: dirtyPrizes.prizes,
        setPrizes: handleSetPrizes,
        isDirty: dirtyPrizes.isDirty,
        wheelData,
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
      }}
    >
      {children}
    </WheelPrizesContext.Provider>
  );
};

export const useWheelPrizes = () => useContext(WheelPrizesContext);
