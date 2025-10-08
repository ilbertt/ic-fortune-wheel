import type { Err } from '@/lib/api/backend/backend';

type GenericResult<T = unknown> =
  | { __kind__: 'ok'; ok: T }
  | { __kind__: 'err'; err: Err };

export const canisterId: string =
  window.document.cookie
    .split('; ')
    .find(row => row.startsWith('canisterId='))
    ?.split('=')[1] ?? import.meta.env.VITE_CANISTER_ID;

/**
 * Extracts the ok value from a generic result.
 * @param result the result to extract the ok or the err
 * @returns the ok value
 * @throws the err value
 */
export const extractOk = <T>(result: GenericResult<T>): T => {
  if (result.__kind__ === 'ok') {
    return result.ok;
  } else {
    throw result.err;
  }
};

export const isErr = (e: unknown): e is Err => {
  return (
    typeof e === 'object' &&
    e !== null &&
    Object.keys(e).length === 2 &&
    'message' in e &&
    'code' in e
  );
};
