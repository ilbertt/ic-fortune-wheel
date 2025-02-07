'use client';

import { FortuneWheelContainer } from '@/components/wheel/container';
import { FortuneWheelLogo } from '@/components/wheel/logo';
import { FortuneWheelModal } from '@/components/wheel/modal';
import { useWheelPrizes } from '@/contexts/wheel-prizes-context';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const FortuneWheel = dynamic(() => import('@/components/wheel/wheel'), {
  ssr: false,
});

export default function Page() {
  const { prizes, spinPrizeByIndex } = useWheelPrizes();

  // TODO: poll extraction from backend
  useEffect(() => {
    if (prizes.length > 0) {
      spinPrizeByIndex(Math.floor(Math.random() * prizes.length));
    }
  }, [prizes, spinPrizeByIndex]);

  return (
    <FortuneWheelContainer className="h-screen w-screen bg-blue-400">
      <FortuneWheel>
        <FortuneWheelLogo className="p-8" />
        <FortuneWheelModal className="bg-blue-400" />
      </FortuneWheel>
    </FortuneWheelContainer>
  );
}
