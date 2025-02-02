'use client';

import { ColorPicker } from '@/components/ui/color-picker';
import { SortableList } from '@/components/ui/sortable-list';
import { useWheelPrizes } from '@/contexts/wheel-prizes-context';

export const SortableWheelPrizesList = () => {
  const { prizes, setPrizes } = useWheelPrizes();

  return (
    <SortableList
      items={prizes}
      onReorder={setPrizes}
      renderItem={item => (
        <div
          className="flex w-full items-center justify-between"
          key={item.wheel_asset_id}
        >
          {item.name}
          <ColorPicker
            value={item.wheel_ui_settings.background_color_hex}
            onChange={color => {
              setPrizes(
                prizes.map(prize =>
                  prize.wheel_asset_id === item.wheel_asset_id
                    ? {
                        ...prize,
                        wheel_ui_settings: {
                          ...prize.wheel_ui_settings,
                          background_color_hex: color,
                        },
                      }
                    : prize,
                ),
              );
            }}
            className="size-6"
          />
        </div>
      )}
      keyExtractor={item => item.wheel_asset_id}
    />
  );
};
