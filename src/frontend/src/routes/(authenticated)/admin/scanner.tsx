import { createFileRoute } from '@tanstack/react-router';
import { PageLayout } from '@/components/layouts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Principal } from '@icp-sdk/core/principal';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Volume2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useCreateWheelPrizeExtraction } from '@/hooks/use-create-wheel-prize-extraction';

export const Route = createFileRoute('/(authenticated)/admin/scanner')({
  component: RouteComponent,
});

function RouteComponent() {
  const [scanError, setScanError] = useState<string | null>(null);
  const createWheelPrizeExtractionMutation = useCreateWheelPrizeExtraction();

  const handleScan: React.ComponentProps<typeof Scanner>['onScan'] =
    useCallback(
      async res => {
        if (res && res[0]) {
          setScanError(null);
          let principal: Principal;
          try {
            principal = Principal.fromText(res[0].rawValue);
          } catch (e) {
            console.warn('Invalid principal', e);
            setScanError('Invalid principal');
            return;
          }
          await createWheelPrizeExtractionMutation.mutateAsync(principal);
        }
      },
      [createWheelPrizeExtractionMutation],
    );

  return (
    <PageLayout>
      <Card className="col-span-full md:col-span-8 md:col-start-3">
        <CardContent className="flex flex-col items-center gap-2 p-3 md:p-6">
          <Scanner
            allowMultiple
            constraints={{
              facingMode: {
                ideal: 'environment',
              },
            }}
            formats={['qr_code']}
            onScan={handleScan}
            classNames={{
              container:
                'rounded-xl overflow-hidden [&_svg]:border-[16px]! md:[&_svg]:border-[32px]!',
            }}
          />
          <Alert>
            <Volume2 />
            <AlertTitle>Turn up your volume</AlertTitle>
            <AlertDescription>
              The scanner plays a sound when a QR code is detected, make sure
              your volume is not muted!
            </AlertDescription>
          </Alert>
          {createWheelPrizeExtractionMutation.status === 'idle' &&
            !scanError && <p>Scanning...</p>}
          {createWheelPrizeExtractionMutation.status === 'pending' && (
            <p>Extracting...</p>
          )}
          {createWheelPrizeExtractionMutation.status === 'success' && (
            <p className="text-xl text-green-500">EXTRACTION SUCCESSFUL</p>
          )}
          {createWheelPrizeExtractionMutation.status === 'error' && (
            <p className="text-xl text-red-500">
              EXTRACTION FAILED:{' '}
              {createWheelPrizeExtractionMutation.error.message}
            </p>
          )}
          {scanError && <p className="text-red-500">SCAN ERROR: {scanError}</p>}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
