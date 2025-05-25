import type { Err } from '@/declarations/backend/backend.did';

type GenericResult<T = unknown> = { ok: T } | { err: Err };

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
  if ('ok' in result) {
    return result.ok;
  } else {
    throw result.err;
  }
};

/**
 * Extracts the err value from a generic result.
 * @param result the result to extract the ok or the err
 * @returns the err value
 * @throws a 'Unexpected response' error if the result is not an err
 */
export const extractErr = <T>(result: GenericResult<T>): Err => {
  if ('err' in result) {
    return result.err;
  } else {
    throw new Error('Unexpected response');
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
