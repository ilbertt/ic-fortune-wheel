import { FortuneWheelContainer } from '@/components/wheel/container';
import { FortuneWheel } from '@/components/wheel/wheel';
import { FortuneWheelLogo } from '@/components/wheel/logo';
import { FortuneWheelModal } from '@/components/wheel/modal';
import { usePollExtraction } from '@/hooks/use-poll-extraction';
import { useWheelPrizes, WheelPrizesProvider } from '@/hooks/use-wheel-prizes';
import { useWheelData } from '@/hooks/use-wheel-data';
import { createFileRoute } from '@tanstack/react-router';
import { ScanLine } from 'lucide-react';

export const Route = createFileRoute('/(unauthenticated)/fw')({
  component: () => {
    return (
      <WheelPrizesProvider>
        <RouteComponent />
      </WheelPrizesProvider>
    );
  },
});

function RouteComponent() {
  const { orderedPrizes } = useWheelPrizes();
  const wheelData = useWheelData({ prizes: orderedPrizes });
  usePollExtraction();

  return (
    <div className="grid h-screen w-screen grid-cols-12 grid-rows-[auto_1fr_auto] bg-[url(/images/background.png)] bg-cover bg-no-repeat p-10">
      <img
        className="col-span-2 col-start-1 w-full"
        src="/images/brand-logo.png"
        alt="brand logo"
      />
      <FortuneWheelContainer className="col-span-8 col-start-3 row-span-full row-start-1 overflow-hidden">
        <FortuneWheel wheelData={wheelData} className="h-full w-full">
          <FortuneWheelLogo className="border-light-pink border-[7px] bg-white p-8 lg:size-40 [&_img]:w-full" />
          <FortuneWheelModal />
        </FortuneWheel>
      </FortuneWheelContainer>
      <div className="bg-light-pink border-pink col-span-2 w-full rounded-[40px] border p-2 pb-4">
        <div className="bg-primary w-full rounded-[40px] p-3">
          <img
            className="aspect-square w-full"
            src="/images/qrcode-oisy-wcs25.svg"
            alt="Oisy QR code"
          />
        </div>
        <div className="text-primary-foreground mt-4 flex flex-row items-center justify-center gap-1 text-2xl">
          <ScanLine className="text-pink size-6" />
          Scan to play
        </div>
      </div>
      <img
        className="col-span-2 col-start-11 row-start-3 h-28 w-auto 2xl:bottom-14 2xl:right-14"
        src="/images/wcs25-logo.svg"
        alt="World Computer Summit 2025 logo"
      />
    </div>
  );
}
