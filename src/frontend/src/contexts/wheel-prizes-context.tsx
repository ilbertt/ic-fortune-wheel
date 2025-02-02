'use client';

import { type WheelAsset } from '@/declarations/backend/backend.did';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { type WheelDataType } from 'react-custom-roulette';
import { useWheelAssets } from '@/contexts/wheel-assets-context';
import { wheelAssetUrl } from '@/lib/wheel-asset';

// TODO: get the type from the backend
type WheelPrize = WheelAsset & {
  backgroundColorHex: string;
};

type WheelPrizesContextType = {
  prizes: WheelPrize[];
  setPrizes: (items: WheelPrize[]) => void;
  wheelData: WheelDataType[];
  isDirty: boolean;
  savePrizes: () => Promise<void>;
  reset: () => void;
};

const WheelPrizesContext = createContext<WheelPrizesContextType>({
  prizes: [],
  setPrizes: () => {},
  wheelData: [],
  isDirty: false,
  savePrizes: () => Promise.reject(),
  reset: () => {},
});

export const WheelPrizesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { enabledAssets, fetchAssets } = useWheelAssets();
  const [prizes, setPrizes] = useState<WheelPrize[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const wheelData = useMemo(
    () =>
      prizes.map(item => {
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
          style: { backgroundColor: item.backgroundColorHex },
        };
      }),
    [prizes],
  );

  const handleSetPrizes = useCallback((prizes: WheelPrize[]) => {
    setPrizes(prizes);
    setIsDirty(true);
  }, []);

  const savePrizes = useCallback(async () => {
    await fetchAssets();
    setIsDirty(false);
  }, [fetchAssets]);

  const reset = useCallback(() => {
    setPrizes(
      enabledAssets.map(asset => ({
        ...asset,
        backgroundColorHex: '#29ABE2',
      })),
    );
    setIsDirty(false);
  }, [enabledAssets]);

  // TODO: remove once the prizes are loaded from the backend
  useEffect(() => {
    setPrizes(prev => {
      if (prev.length === 0) {
        return enabledAssets.map(asset => ({
          ...asset,
          backgroundColorHex: '#29ABE2',
        }));
      }
      return prev.map(el => {
        const asset = enabledAssets.find(a => a.id === el.id);
        if (!asset) {
          return {
            ...el,
            backgroundColorHex: '#29ABE2',
          };
        }
        return {
          ...asset,
          backgroundColorHex: el.backgroundColorHex,
        };
      });
    });
  }, [enabledAssets]);

  return (
    <WheelPrizesContext.Provider
      value={{
        prizes,
        setPrizes: handleSetPrizes,
        isDirty,
        wheelData,
        savePrizes,
        reset,
      }}
    >
      {children}
    </WheelPrizesContext.Provider>
  );
};

export const useWheelPrizes = () => useContext(WheelPrizesContext);
