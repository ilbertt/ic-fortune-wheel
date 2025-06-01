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
          'relative h-screen w-screen',
          '[&>div]:first:h-[min(90vw,90vh)]! [&>div]:first:w-[min(90vw,90vh)]! [&>div]:first:max-h-[90vh]! [&>div]:first:max-w-none! [&>div]:first:left-1/2! [&>div]:first:top-1/2! [&>div]:first:-translate-x-1/2! [&>div]:first:-translate-y-1/2! [&>div]:first:absolute [&>div]:first:aspect-square',
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
              transform: 'translate(-25%, 25%) rotate(250deg)',
            },
          }}
          outerBorderWidth={10}
          outerBorderColor="#EEE7FF" // light-pink
          radiusLineWidth={0}
        />
      </div>
      {children}
    </>
  );
};
