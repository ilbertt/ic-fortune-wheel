import { useAuth } from '@/contexts/auth-context';
import { getLedgerActor } from '@/lib/ledger';
import { Actor } from '@dfinity/agent';
import { type IcrcTokenMetadata, mapTokenMetadata } from '@dfinity/ledger-icrc';
import { Principal } from '@dfinity/principal';
import { useQuery } from '@tanstack/react-query';

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
  onSuccess,
  onError,
}: UseLedgerCanisterMetadataParams): UseLedgerCanisterMetadataReturn => {
  const { actor } = useAuth();

  const { data, isPending } = useQuery({
    queryKey: [
      'ledger-canister-metadata',
      ledgerCanisterIdProp?.toString() || '',
    ],
    queryFn: async () => {
      if (!ledgerCanisterIdProp || !actor) {
        return null;
      }

      try {
        const ledgerCanisterId = Principal.from(ledgerCanisterIdProp);
        const ledgerActor = getLedgerActor(
          ledgerCanisterId,
          Actor.agentOf(actor)!,
        );

        const result = await ledgerActor.metadata({});
        const mappedResult = mapTokenMetadata(result) || null;

        if (mappedResult && onSuccess) {
          onSuccess(mappedResult);
        }

        return mappedResult;
      } catch (error) {
        console.error(error);
        if (onError) {
          onError();
        }
        throw error;
      }
    },
    enabled: !!ledgerCanisterIdProp && !!actor,
    meta: {
      errorMessage: 'Error fetching ledger canister metadata',
    },
  });

  return {
    isFetchingLedgerCanisterMetadata: isPending,
    ledgerCanisterMetadata: data || null,
  };
};
