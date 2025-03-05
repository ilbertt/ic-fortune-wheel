import type { Err } from '@/declarations/backend/backend.did';
import '@tanstack/react-query';

type QueryKey = [
  (
    | 'team-members'
    | 'user'
    | 'activity'
    | 'wheel-prize-extractions-stats'
    | 'wheel-prizes'
  ),
  ...ReadonlyArray<string>,
];
type QueryMeta = {
  errorMessage?: string;
};

declare module '@tanstack/react-query' {
  interface Register {
    queryKey: QueryKey;
    mutationKey: QueryKey;
    queryMeta: QueryMeta;
    mutationMeta: QueryMeta;
    defaultError: Err;
  }
}
