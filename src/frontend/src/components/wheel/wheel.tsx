'use client';

import Pointer from '@/assets/wheel/pointer.png';
import { useWheelPrizes } from '@/hooks/use-wheel-prizes';
import { Wheel } from 'react-custom-roulette';
import { cn } from '@/lib/utils';

type FortuneWheelProps = React.HTMLAttributes<HTMLDivElement>;

const FortuneWheel: React.FC<FortuneWheelProps> = ({
  className,
  children,
  ...props
}) => {
  const { wheelData, stopSpinning, currentPrize } = useWheelPrizes();

  if (wheelData.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        No prizes available
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'relative h-full w-full',
          'first:[&>div]:absolute first:[&>div]:left-1/2 first:[&>div]:top-1/2 first:[&>div]:h-full first:[&>div]:max-h-[48rem] first:[&>div]:w-full first:[&>div]:max-w-[48rem] first:[&>div]:-translate-x-1/2 first:[&>div]:-translate-y-1/2',
          className,
        )}
        {...props}
      >
        <Wheel
          mustStartSpinning={currentPrize !== null}
          onStopSpinning={stopSpinning}
          prizeNumber={currentPrize?.index ?? -1}
          startingOptionIndex={0}
          data={wheelData}
          pointerProps={{
            src: Pointer.src,
            style: {
              transform: 'translate(-15%, 15%) rotate(250deg)',
            },
          }}
          outerBorderWidth={3}
          outerBorderColor="white"
          radiusLineWidth={3}
          radiusLineColor="white"
        />
      </div>
      {children}
    </>
  );
};

export default FortuneWheel;
