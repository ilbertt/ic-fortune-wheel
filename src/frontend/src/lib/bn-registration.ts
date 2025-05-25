/**
 * Code inspired from https://github.com/junobuild/juno/blob/2d9ef8a96fa3585d547188bf2c7fa3ff1e6a813b/src/frontend/src/lib/rest/bn.rest.ts.
 */

import type { Err } from '@/declarations/backend/backend.did';
import { isErr } from '@/lib/api';

const BN_REGISTRATION_URL = 'https://icp0.io/registrations';

const MOCK_API_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_DFX_NETWORK === 'local';
const MOCK_API_LATENCY_MS = 1_000;

type CustomDomainRegistrationState =
  | 'PendingOrder'
  | 'PendingChallengeResponse'
  | 'PendingAcmeApproval'
  | 'Available'
  | 'Failed';

type CustomDomainRegistrationStateFailed = {
  Failed: string;
};

type CustomDomainRegistration = {
  name: string;
  canister: string;
  state: CustomDomainRegistrationState | CustomDomainRegistrationStateFailed;
};

export type GetBnRegistrationRequestParams = {
  /**
   * The request ID of the registration request.
   */
  requestId: string;
};

export type GetBnRegistrationResponse = CustomDomainRegistration;

/**
 * Gets a custom domain registration status from the Boundary Nodes.
 *
 * @see https://internetcomputer.org/docs/building-apps/frontends/custom-domains/using-custom-domains
 * @throws {Err} if something goes wrong.
 */
export async function getBnRegistration(
  params: GetBnRegistrationRequestParams,
): Promise<GetBnRegistrationResponse> {
  if (MOCK_API_ENABLED) {
    return await mockGetBnRegistration(params);
  }
  try {
    const res = await fetch(`${BN_REGISTRATION_URL}/${params.requestId}`, {
      method: 'GET',
    });
    if (!res.ok) {
      const err: Err = {
        message: await res.text(),
        code: res.status,
      };
      throw err;
    }
    return await res.json();
  } catch (e) {
    throw parseError(e);
  }
}

/**
 * Same as {@link getBnRegistration}, to be used in dev mode.
 */
async function mockGetBnRegistration(
  params: GetBnRegistrationRequestParams,
): Promise<GetBnRegistrationResponse> {
  return new Promise(resolve => {
    console.warn('mockGetBnRegistration', params);
    setTimeout(() => {
      resolve({
        name: 'mock-domain.com',
        canister: 'mock-canister',
        // uncomment to test other states
        state: 'PendingOrder',
        // state: 'Available',
        // state: 'Failed',
        // state: 'PendingAcmeApproval',
        // state: 'PendingChallengeResponse',
        // state: { Failed: 'Mock error message' },
      });
    }, MOCK_API_LATENCY_MS);
  });
}

export type CreateBnRegistrationRequestParams = {
  /**
   * The domain name to register.
   */
  name: string;
};

export type CreateBnRegistrationResponse = {
  /**
   * The request ID of the registration request.
   */
  id: string;
};

/**
 * Registers a custom domain on the Boundary Nodes.
 *
 * @see https://internetcomputer.org/docs/building-apps/frontends/custom-domains/using-custom-domains
 * @throws {Err} if something goes wrong.
 */
export async function createBnRegistration(
  params: CreateBnRegistrationRequestParams,
): Promise<CreateBnRegistrationResponse> {
  if (MOCK_API_ENABLED) {
    return await mockCreateBnRegistration(params);
  }
  try {
    const res = await fetch(BN_REGISTRATION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err: Err = {
        message: await res.text(),
        code: res.status,
      };
      throw err;
    }
    const responseBody: CreateBnRegistrationResponse = await res.json();
    if (!responseBody.id) {
      const err: Err = {
        message: `Invalid response body: ${responseBody}`,
        code: 500,
      };
      throw err;
    }
    return responseBody;
  } catch (e) {
    throw parseError(e);
  }
}

/**
 * Same as {@link createBnRegistration}, to be used in dev mode.
 */
async function mockCreateBnRegistration(
  params: CreateBnRegistrationRequestParams,
): Promise<CreateBnRegistrationResponse> {
  return new Promise(resolve => {
    console.warn('mockCreateBnRegistration', params);
    setTimeout(() => {
      resolve({ id: 'mock-id' });
    }, MOCK_API_LATENCY_MS);
  });
}

export type DeleteBnRegistrationRequestParams = {
  /**
   * The request ID of the registration request.
   */
  requestId: string;
};

/**
 * Deletes a custom domain registration from the Boundary Nodes.
 *
 * @see https://internetcomputer.org/docs/building-apps/frontends/custom-domains/using-custom-domains
 * @throws {Err} if something goes wrong.
 */
export async function deleteBnRegistration(
  params: DeleteBnRegistrationRequestParams,
): Promise<void> {
  if (MOCK_API_ENABLED) {
    return await mockDeleteBnRegistration(params);
  }
  try {
    const res = await fetch(`${BN_REGISTRATION_URL}/${params.requestId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err: Err = {
        message: await res.text(),
        code: res.status,
      };
      throw err;
    }
  } catch (e) {
    throw parseError(e);
  }
}

/**
 * Same as {@link deleteBnRegistration}, to be used in dev mode.
 */
async function mockDeleteBnRegistration(
  params: DeleteBnRegistrationRequestParams,
): Promise<void> {
  return new Promise(resolve => {
    console.warn('mockDeleteBnRegistration', params);
    setTimeout(() => {
      resolve();
    }, MOCK_API_LATENCY_MS);
  });
}

function parseError(e: unknown): Err {
  if (isErr(e)) {
    return e;
  }
  return {
    message: e instanceof Error ? e.message : 'Unknown error',
    code: 500,
  };
}
