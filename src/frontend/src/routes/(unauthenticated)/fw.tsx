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
    <div className="bg-[url(/images/background.png)] bg-cover bg-no-repeat">
      <img
        className="absolute left-10 top-10 z-10 h-16 w-auto 2xl:bottom-14 2xl:right-14"
        src="/images/brand-logo.png"
        alt="brand logo"
      />
      <div className="bg-light-pink border-pink absolute right-10 top-10 rounded-[40px] border p-2 2xl:bottom-14 2xl:right-14">
        <div className="bg-primary size-64 rounded-[40px] p-3 2xl:size-[300px]">
          <img
            className="aspect-square w-full"
            src="/images/qrcode-oisy.svg"
            alt="Oisy QR code"
          />
        </div>
        <div className="text-primary-foreground mt-4 flex flex-row items-center justify-center gap-1 text-2xl">
          <ScanLine className="text-pink size-6" />
          Scan to play
        </div>
      </div>
      <FortuneWheelContainer className="h-screen w-screen overflow-hidden">
        <FortuneWheel wheelData={wheelData}>
          <FortuneWheelLogo className="border-light-pink border-[7px] bg-white p-8 lg:w-44 xl:w-72 [&_img]:h-32 [&_img]:w-auto" />
          <FortuneWheelModal />
        </FortuneWheel>
      </FortuneWheelContainer>
      <img
        className="absolute bottom-10 right-10 z-10 h-28 w-auto 2xl:bottom-14 2xl:right-14"
        src="/images/wcs25-logo.svg"
        alt="World Computer Summit 2025 logo"
      />
    </div>
  );
}
