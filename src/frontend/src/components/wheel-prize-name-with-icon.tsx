import type { WheelPrize } from '@/declarations/backend/backend.did';
import { wheelAssetUrl } from '@/lib/wheel-asset';
import { cn } from '@/lib/utils';

type WheelPrizeNameWithIconProps = {
  wheelPrize: WheelPrize;
  className?: string;
};

export const WheelPrizeNameWithIcon: React.FC<WheelPrizeNameWithIconProps> = ({
  wheelPrize,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-row items-center justify-start gap-2',
        className,
      )}
    >
      {wheelPrize.wheel_image_path[0] && (
        <img
          className="aspect-square max-h-6 max-w-6 object-contain"
          src={wheelAssetUrl(wheelPrize.wheel_image_path)!}
          alt={wheelPrize.name}
          width={50}
          height={50}
        />
      )}
      {wheelPrize.name}
    </div>
  );
};
