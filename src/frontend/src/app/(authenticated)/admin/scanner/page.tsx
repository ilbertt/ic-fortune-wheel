'use client';

import { PageLayout } from '@/components/layouts';
import { Card, CardContent } from '@/components/ui/card';
import { Principal } from '@dfinity/principal';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useCallback, useState } from 'react';

export default function Page() {
  const [scannedPrincipal, setScannedPrincipal] = useState<Principal | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleScan: React.ComponentProps<typeof Scanner>['onScan'] =
    useCallback(res => {
      if (res && res[0]) {
        try {
          const principal = Principal.fromText(res[0].rawValue);
          setError(null);
          setScannedPrincipal(principal);
        } catch (e) {
          console.warn('Invalid principal', e);
          setError('Invalid principal');
          setScannedPrincipal(null);
        }
      }
    }, []);

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
                'rounded-xl overflow-hidden [&_svg]:!border-[16px] [&_svg]:md:!border-[32px]',
            }}
          />
          {!scannedPrincipal && !error && <p>Scanning...</p>}
          {scannedPrincipal && (
            <p>Scanned Principal: {scannedPrincipal.toText()}</p>
          )}
          {error && <p className="text-red-500">{error}</p>}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
