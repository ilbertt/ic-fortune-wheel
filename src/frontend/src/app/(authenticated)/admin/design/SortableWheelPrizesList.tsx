'use client';

import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { SortableList } from '@/components/ui/sortable-list';
import { useWheelPrizes } from '@/hooks/use-wheel-prizes';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { wheelAssetUrl } from '@/lib/wheel-asset';

export const SortableWheelPrizesList = () => {
  const { prizes, setPrizes, currentPrize, spinPrizeByIndex } =
    useWheelPrizes();

  return (
    <SortableList
      items={prizes}
      onReorder={setPrizes}
      renderItem={(item, index) => (
        <div
          className="flex min-h-8 w-full flex-row items-center justify-between gap-2"
          key={item.wheel_asset_id}
        >
          <div className="flex flex-row items-center justify-start gap-2">
            {item.wheel_image_path[0] && (
              <Image
                className="aspect-square max-h-6 max-w-6 object-contain"
                src={wheelAssetUrl(item.wheel_image_path)!}
                alt={item.name}
                width={50}
                height={50}
              />
            )}
            {item.name}
          </div>
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
            {(currentPrize === null || currentPrize.index === index) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => spinPrizeByIndex(index)}
                className={cn('disabled:opacity-100', {
                  'text-indaco-blue animate-pulse':
                    currentPrize?.index === index,
                })}
                disabled={currentPrize?.index === index}
              >
                <Play />
                {currentPrize?.index === index ? 'Spinning...' : 'Simulate'}
              </Button>
            )}
          </div>
        </div>
      )}
      keyExtractor={item => item.wheel_asset_id}
    />
  );
};
