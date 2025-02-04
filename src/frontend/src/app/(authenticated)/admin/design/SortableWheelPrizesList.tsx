'use client';

import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { SortableList } from '@/components/ui/sortable-list';
import { useWheelPrizes } from '@/contexts/wheel-prizes-context';
import { useAtom } from 'jotai';
import { Play } from 'lucide-react';
import { wheelAtom } from './atoms';
import { cn } from '@/lib/utils';

export const SortableWheelPrizesList = () => {
  const { prizes, setPrizes } = useWheelPrizes();
  const [wheel, setWheel] = useAtom(wheelAtom);

  return (
    <SortableList
      items={prizes}
      onReorder={setPrizes}
      renderItem={(item, index) => (
        <div
          className="flex min-h-8 w-full flex-row items-center justify-between gap-2"
          key={item.wheel_asset_id}
        >
          {item.name}
          <div className="flex flex-col items-center gap-2 md:flex-row-reverse">
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
            {(wheel.extractPrizeIndex === null ||
              wheel.extractPrizeIndex === index) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setWheel({ extractPrizeIndex: index })}
                className={cn('disabled:opacity-100', {
                  'text-indaco-blue animate-pulse':
                    wheel.extractPrizeIndex === index,
                })}
                disabled={wheel.extractPrizeIndex === index}
              >
                <Play />
                {wheel.extractPrizeIndex === index ? 'Spinning...' : 'Simulate'}
              </Button>
            )}
          </div>
        </div>
      )}
      keyExtractor={item => item.wheel_asset_id}
    />
  );
};
