import type { CustomDomainRecordBnRegistrationState } from '@/lib/api/backend/backend';

export const bnRegistrationIdFromBnRegistrationState = (
  state: CustomDomainRecordBnRegistrationState,
): string | undefined => {
  if (state.__kind__ === 'pending') {
    return state.pending.bn_registration_id;
  } else if (state.__kind__ === 'registered') {
    return state.registered.bn_registration_id;
  } else if (state.__kind__ === 'failed') {
    return state.failed.bn_registration_id;
  }
  return undefined;
};

export const bnRegistrationErrorMessageFromBnRegistrationState = (
  state: CustomDomainRecordBnRegistrationState,
): string | undefined => {
  if (state.__kind__ === 'failed') {
    return state.failed.error_message;
  }
  return undefined;
};
