import type { Err } from '@/declarations/backend/backend.did';

type GenericResult<T = unknown> = { ok: T } | { err: Err };

export const extractOk = <T>(result: GenericResult<T>): T => {
  if ('ok' in result) {
    return result.ok;
  } else {
    throw new Error('Unexpected error');
  }
};

export const extractErr = <T>(result: GenericResult<T>): Err => {
  if ('err' in result) {
    return result.err;
  } else {
    throw new Error('Unexpected response');
  }
};
