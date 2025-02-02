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
        <div className="flex w-full items-center justify-between" key={item.id}>
          {item.name}
          <ColorPicker
            value={item.backgroundColorHex}
            onChange={color => {
              setPrizes(
                prizes.map(prize =>
                  prize.id === item.id
                    ? { ...prize, backgroundColorHex: color }
                    : prize,
                ),
              );
            }}
            className="size-6"
          />
        </div>
      )}
      keyExtractor={item => item.id}
    />
  );
};
