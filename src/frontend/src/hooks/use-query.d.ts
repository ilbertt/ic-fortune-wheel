import type { Err } from '@/lib/api/backend/backend';
import '@tanstack/react-query';

type QueryKey = [
  (
    | 'team-members'
    | 'user'
    | 'activity'
    | 'wheel-prize-extractions-stats'
    | 'wheel-prizes'
    | 'wheel-assets'
    | 'ledger-canister-metadata'
    | 'last-wheel-prize-extraction'
    | 'custom-domain-records'
    | 'bn-registration'
  ),
  ...ReadonlyArray<string>,
];
type QueryMeta = {
  errorMessage?: string;
};

declare module '@tanstack/react-query' {
  interface Register {
    queryKey: QueryKey;
    queryMeta: QueryMeta;
    mutationMeta: QueryMeta;
    defaultError: Err;
  }
}
