'use client';

import { PageLayout } from '@/components/layouts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { Err } from '@/declarations/backend/backend.did';
import { extractOk } from '@/lib/api';
import { renderError } from '@/lib/utils';
import { Principal } from '@dfinity/principal';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Volume2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

const EXTRACTION_RESULT_RESET_TIMEOUT_MS = 20_000;

type ExtractionState =
  | {
      state: 'extracting';
    }
  | {
      state: 'completed';
    }
  | {
      state: 'error';
      message: string;
    }
  | null;

export default function Page() {
  const { actor } = useAuth();
  const [scanError, setScanError] = useState<string | null>(null);
  const [extractionState, setExtractionState] = useState<ExtractionState>(null);
  const isExtractingRef = useRef(false);

  const handleScan: React.ComponentProps<typeof Scanner>['onScan'] =
    useCallback(
      res => {
        if (res && res[0] && !isExtractingRef.current) {
          try {
            const principal = Principal.fromText(res[0].rawValue);
            setScanError(null);
            isExtractingRef.current = true;
            setExtractionState({ state: 'extracting' });
            actor
              .create_wheel_prize_extraction({
                extract_for_principal: principal,
              })
              .then(extractOk)
              .then(() => {
                setExtractionState({ state: 'completed' });
              })
              .catch((e: Err) => {
                console.warn('Failed to extract prize', e);
                setExtractionState({
                  state: 'error',
                  message: renderError(e),
                });
              })
              .finally(() => {
                isExtractingRef.current = false;
                setTimeout(() => {
                  setExtractionState(null);
                }, EXTRACTION_RESULT_RESET_TIMEOUT_MS);
              });
          } catch (e) {
            console.warn('Invalid principal', e);
            setScanError('Invalid principal');
          }
        }
      },
      [actor],
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
                'rounded-xl overflow-hidden [&_svg]:!border-[16px] [&_svg]:md:!border-[32px]',
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
          {!extractionState && !scanError && <p>Scanning...</p>}
          {extractionState && extractionState.state === 'extracting' && (
            <p>Extracting...</p>
          )}
          {extractionState && extractionState.state === 'completed' && (
            <p className="text-xl text-green-500">EXTRACTION SUCCESSFUL</p>
          )}
          {extractionState &&
            extractionState.state === 'error' &&
            extractionState.message && (
              <p className="text-xl text-red-500">
                EXTRACTION FAILED: {extractionState.message}
              </p>
            )}
          {scanError && <p className="text-red-500">SCAN ERROR: {scanError}</p>}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
