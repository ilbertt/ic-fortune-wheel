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

const mapPrizesToWheelData = (prizes: WheelPrize[]) => {
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

  const fetchPrizes = useCallback(async () => {
    setFetching(true);
    return actor
      ?.list_wheel_prizes()
      .then(extractOk)
      .then(newPrizes => {
        setPrizes(newPrizes);
        setDirtyPrizes({ prizes: newPrizes, isDirty: false });
        setWheelData(mapPrizesToWheelData(newPrizes));
      })
      .catch((e: Err) => {
        toast({
          title: 'Error fetching assets',
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
    await fetchPrizes();
    setDirtyPrizes(prev => ({ ...prev, isDirty: false }));
  }, [fetchPrizes]);

  const resetChanges = useCallback(() => {
    setDirtyPrizes({ prizes, isDirty: false });
    setWheelData(mapPrizesToWheelData(prizes));
  }, [prizes]);

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
      }}
    >
      {children}
    </WheelPrizesContext.Provider>
  );
};

export const useWheelPrizes = () => useContext(WheelPrizesContext);
