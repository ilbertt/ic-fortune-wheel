'use client';

import { useAuth } from '@/contexts/auth-context';
import { getLedgerActor } from '@/lib/ledger';
import { Actor } from '@dfinity/agent';
import { type IcrcTokenMetadata, mapTokenMetadata } from '@dfinity/ledger-icrc';
import { Principal } from '@dfinity/principal';
import { useEffect, useState } from 'react';

type UseLedgerCanisterMetadataParams = {
  ledgerCanisterId: Principal | string | undefined;
  onSuccess?: (metadata: IcrcTokenMetadata) => void;
  onError?: () => void;
};

type UseLedgerCanisterMetadataReturn = {
  isFetchingLedgerCanisterMetadata: boolean;
  ledgerCanisterMetadata: IcrcTokenMetadata | null;
};

export const useLedgerCanisterMetadata = ({
  ledgerCanisterId: ledgerCanisterIdProp,
  onError,
  onSuccess,
}: UseLedgerCanisterMetadataParams): UseLedgerCanisterMetadataReturn => {
  const { actor } = useAuth();
  const [
    isFetchingLedgerCanisterMetadata,
    setIsFetchingLedgerCanisterMetadata,
  ] = useState(false);
  const [metadata, setMetadata] = useState<IcrcTokenMetadata | null>(null);

  useEffect(() => {
    if (ledgerCanisterIdProp) {
      try {
        const ledgerCanisterId = Principal.from(ledgerCanisterIdProp);
        const ledgerActor = getLedgerActor(
          ledgerCanisterId,
          Actor.agentOf(actor)!,
        );
        setIsFetchingLedgerCanisterMetadata(true);
        ledgerActor
          .metadata({})
          .then(mapTokenMetadata)
          .then(metadata => {
            const metadataRes = metadata || null;
            setMetadata(metadataRes);
            if (metadataRes && onSuccess) {
              onSuccess(metadataRes);
            }
          })
          .catch(err => {
            console.error(err);
            if (onError) {
              onError();
            }
          })
          .finally(() => {
            setIsFetchingLedgerCanisterMetadata(false);
          });
      } catch {
        // do nothing
      }
    }
  }, [ledgerCanisterIdProp, actor, onSuccess, onError]);

  return {
    isFetchingLedgerCanisterMetadata,
    ledgerCanisterMetadata: metadata,
  };
};
