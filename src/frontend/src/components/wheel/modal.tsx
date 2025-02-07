'use client';

import { useWheelPrizes } from '@/contexts/wheel-prizes-context';
import { cn } from '@/lib/utils';
import { wheelAssetUrl } from '@/lib/wheel-asset';
import Image from 'next/image';
import { useEffect } from 'react';

const MODAL_DURATION_MS = 5_000;

type FortuneWheelModalProps = React.HTMLAttributes<HTMLDivElement>;

export const FortuneWheelModal: React.FC<FortuneWheelModalProps> = ({
  className,
  ...props
}) => {
  const { currentPrize, isModalOpen, resetCurrentPrize } = useWheelPrizes();

  useEffect(() => {
    if (isModalOpen) {
      const timeout = setTimeout(() => {
        resetCurrentPrize();
      }, MODAL_DURATION_MS);

      return () => clearTimeout(timeout);
    }
  }, [isModalOpen, resetCurrentPrize]);

  if (!currentPrize || !isModalOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute left-0 top-0 z-20 flex h-full w-full flex-col items-center justify-center gap-10',
        className,
      )}
      {...props}
    >
      <h1 className="text-center text-5xl font-bold">You Won!</h1>
      {currentPrize.prize.modal_image_path[0] && (
        <Image
          className="h-1/2 w-auto"
          src={wheelAssetUrl(currentPrize.prize.modal_image_path)!}
          alt="prize modal image"
          width={600}
          height={600}
        />
      )}
      <div className="rounded-xl bg-red-500 px-4 py-2 text-3xl font-bold">
        {currentPrize.prize.name}
      </div>
    </div>
  );
};
