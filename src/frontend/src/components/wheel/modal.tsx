'use client';

import { useWheelPrizes } from '@/contexts/wheel-prizes-context';
import { cn } from '@/lib/utils';
import { wheelAssetUrl } from '@/lib/wheel-asset';
import Image from 'next/image';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const MODAL_DURATION_MS = 15_000;

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
        'absolute left-0 top-0 z-20 flex h-full w-full flex-col items-center justify-center gap-10 backdrop-blur-3xl',
        className,
      )}
      {...props}
    >
      <Button
        className="absolute right-5 top-5 z-30 size-5 rounded-full lg:size-8 xl:size-10"
        variant="destructive"
        size="icon"
        onClick={resetCurrentPrize}
      >
        <X className="lg:!size-6 xl:!size-8" />
      </Button>
      <h1 className="text-center text-5xl font-bold xl:text-[6vw]">YOU WON!</h1>
      {currentPrize.prize.modal_image_path[0] && (
        <Image
          className="modal-image-animation h-2/5 w-auto"
          src={wheelAssetUrl(currentPrize.prize.modal_image_path)!}
          alt="prize modal image"
          width={600}
          height={600}
        />
      )}
      <div className="prize-name-animation bg-ic-gradient rounded-xl px-4 py-2 text-3xl font-bold xl:text-5xl">
        {currentPrize.prize.prize_usd_amount
          ? `$${currentPrize.prize.prize_usd_amount} in `
          : ''}
        {currentPrize.prize.name}
      </div>
    </div>
  );
};
