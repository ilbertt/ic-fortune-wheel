'use client';

import { FortuneWheelContainer } from '@/components/wheel/container';
import { FortuneWheelLogo } from '@/components/wheel/logo';
import { FortuneWheelModal } from '@/components/wheel/modal';
import { useWheelPrizes } from '@/contexts/wheel-prizes-context';
import dynamic from 'next/dynamic';
import Image from 'next/image';
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
    <>
      <Image
        className="absolute left-5 top-10 z-10 h-10 w-auto"
        src="/images/brand-logo.png"
        alt="brand logo"
        width={264}
        height={64}
      />
      <Image
        className="absolute right-5 top-10 z-10 size-64"
        src="/images/qrcode-oisy.png"
        alt="qrcode"
        width={200}
        height={200}
      />
      <FortuneWheelContainer className="app-background h-screen w-screen">
        <FortuneWheel>
          <FortuneWheelLogo className="p-8 lg:w-44 xl:w-48" />
          <FortuneWheelModal />
        </FortuneWheel>
      </FortuneWheelContainer>
      <Image
        className="absolute bottom-5 right-5 z-10 h-16 w-auto"
        src="/images/icp-badge.png"
        alt="ICP badge"
        width={264}
        height={64}
      />
    </>
  );
}
