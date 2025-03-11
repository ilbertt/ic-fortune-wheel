import type { Err } from '@/declarations/backend/backend.did';
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
