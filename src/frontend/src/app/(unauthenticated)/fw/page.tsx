'use client';

import { FortuneWheelContainer } from '@/components/wheel/container';
import { FortuneWheelLogo } from '@/components/wheel/logo';
import { FortuneWheelModal } from '@/components/wheel/modal';
import { useAuth } from '@/contexts/auth-context';
import { useWheelPrizes } from '@/hooks/use-wheel-prizes';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import type { Err } from '@/declarations/backend/backend.did';
import { extractOk } from '@/lib/api';
import { isWheelPrizeExtractionCompleted } from '@/lib/wheel-prize-extraction';

const FortuneWheel = dynamic(() => import('@/components/wheel/wheel'), {
  ssr: false,
});

const LAST_EXTRACTION_POLLING_INTERVAL_MS = 1_500;

export default function Page() {
  const { actor } = useAuth();
  const { prizes, spinPrizeByWheelAssetId } = useWheelPrizes();
  const lastExtractionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const pollExtraction = () => {
      if (prizes.length > 0) {
        // eslint-disable-next-line no-console
        console.log('FORTUNE WHEEL: Polling extraction...');
        actor
          .get_last_wheel_prize_extraction()
          .then(extractOk)
          .then(res => {
            const newExtraction = res[0];
            if (
              newExtraction &&
              newExtraction.id !== lastExtractionIdRef.current &&
              isWheelPrizeExtractionCompleted(newExtraction.state) &&
              newExtraction.wheel_asset_id[0]
            ) {
              spinPrizeByWheelAssetId(newExtraction.wheel_asset_id[0]);
              lastExtractionIdRef.current = newExtraction.id;
              // eslint-disable-next-line no-console
              console.log(
                'FORTUNE WHEEL: Polling completed: Found new prize',
                newExtraction,
              );
            } else {
              // eslint-disable-next-line no-console
              console.log('FORTUNE WHEEL: Polling completed: No new prize');
            }
          })
          .catch((e: Err) => {
            // silently warn in the console, shouldn't happen
            console.warn('FORTUNE WHEEL: Polling failed:', e);
          });
      }
    };

    pollExtraction();

    const interval = setInterval(
      pollExtraction,
      LAST_EXTRACTION_POLLING_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, [prizes, spinPrizeByWheelAssetId, actor]);

  return (
    <>
      <Image
        className="absolute left-5 top-10 z-10 h-12 w-auto"
        src="/images/brand-logo.svg"
        alt="brand logo"
        width={356}
        height={64}
      />
      <Image
        className="absolute right-5 top-10 z-10 size-64"
        src="/images/qrcode-oisy.svg"
        alt="Oisy QR code"
        width={200}
        height={200}
      />
      <FortuneWheelContainer className="app-background h-screen w-screen overflow-hidden">
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
