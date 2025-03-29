import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { SortableList } from '@/components/ui/sortable-list';
import { useWheelPrizes } from '@/hooks/use-wheel-prizes';
import { Copy, Play, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WheelPrizeNameWithIcon } from '@/components/wheel-prize-name-with-icon';

export const SortableWheelPrizesList = () => {
  const {
    orderedPrizes,
    updatePrize,
    updatePrizesOrder,
    duplicatePrizeInOrder,
    removePrizeFromOrder,
    currentPrize,
    spinPrizeByIndex,
  } = useWheelPrizes();

  return (
    <SortableList
      items={orderedPrizes}
      keyExtractor={item => item.uniqueIndex}
      onReorder={updatePrizesOrder}
      renderItem={(prize, index) => {
        return (
          <div className="flex min-h-8 w-full flex-row items-center justify-between gap-2">
            <WheelPrizeNameWithIcon wheelPrize={prize} />
            <div className="flex flex-col items-center gap-2 md:flex-row-reverse">
              <div className="flex flex-row items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => duplicatePrizeInOrder(index)}
                >
                  <Copy />
                </Button>
                {orderedPrizes.filter(
                  el => el.wheel_asset_id === prize.wheel_asset_id,
                ).length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePrizeFromOrder(index)}
                  >
                    <Trash2 className="text-red-500" />
                  </Button>
                )}
              </div>
              <ColorPicker
                value={prize.wheel_ui_settings.background_color_hex}
                onChange={color => {
                  updatePrize({
                    ...prize,
                    wheel_ui_settings: {
                      ...prize.wheel_ui_settings,
                      background_color_hex: color,
                    },
                  });
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
        );
      }}
    />
  );
};
