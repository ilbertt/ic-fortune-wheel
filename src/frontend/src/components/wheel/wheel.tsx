import { useWheelPrizes } from '@/hooks/use-wheel-prizes';
import { Wheel, type WheelDataType } from 'react-custom-roulette';
import { cn } from '@/lib/utils';

type FortuneWheelProps = React.HTMLAttributes<HTMLDivElement> & {
  wheelData: WheelDataType[];
};

export const FortuneWheel: React.FC<FortuneWheelProps> = ({
  className,
  children,
  wheelData,
  ...props
}) => {
  const { stopSpinning, currentPrize } = useWheelPrizes();

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
          '[&>div]:first:h-full! [&>div]:first:max-h-[48rem]! [&>div]:first:w-full! [&>div]:first:max-w-[48rem]! [&>div]:first:left-1/2! [&>div]:first:top-1/2! [&>div]:first:-translate-x-1/2! [&>div]:first:-translate-y-1/2! [&>div]:first:absolute',
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
            src: '/images/pointer.png',
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
