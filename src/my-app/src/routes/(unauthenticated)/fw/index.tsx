import { FortuneWheelContainer } from '@/components/wheel/container';
import { FortuneWheel } from '@/components/wheel/wheel';
import { FortuneWheelLogo } from '@/components/wheel/logo';
import { FortuneWheelModal } from '@/components/wheel/modal';
import { usePollExtraction } from '@/hooks/use-poll-extraction';
import { useWheelPrizes } from '@/hooks/use-wheel-prizes';
import { useWheelData } from '@/hooks/use-wheel-data';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(unauthenticated)/fw/')({
  component: Page,
});

function Page() {
  const { orderedPrizes } = useWheelPrizes();
  const wheelData = useWheelData({ prizes: orderedPrizes });
  usePollExtraction();

  return (
    <>
      <img
        className="absolute left-5 top-10 z-10 h-12 w-auto"
        src="/images/brand-logo.svg"
        alt="brand logo"
        width={356}
        height={64}
      />
      <img
        className="absolute right-5 top-10 z-10 size-64"
        src="/images/qrcode-oisy.svg"
        alt="Oisy QR code"
        width={200}
        height={200}
      />
      <FortuneWheelContainer className="app-background h-screen w-screen overflow-hidden">
        <FortuneWheel wheelData={wheelData}>
          <FortuneWheelLogo className="p-8 lg:w-44 xl:w-48" />
          <FortuneWheelModal />
        </FortuneWheel>
      </FortuneWheelContainer>
      <img
        className="absolute bottom-5 right-5 z-10 h-16 w-auto"
        src="/images/icp-badge.png"
        alt="ICP badge"
        width={264}
        height={64}
      />
    </>
  );
}
