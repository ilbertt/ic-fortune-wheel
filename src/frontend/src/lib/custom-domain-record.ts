import type { CustomDomainRecordBnRegistrationState } from '@/declarations/backend/backend.did';

export const bnRegistrationIdFromBnRegistrationState = (
  state: CustomDomainRecordBnRegistrationState,
): string | undefined => {
  if ('pending' in state) {
    return state.pending.bn_registration_id;
  } else if ('registered' in state) {
    return state.registered.bn_registration_id;
  } else if ('failed' in state) {
    return state.failed.bn_registration_id;
  }
  return undefined;
};

export const bnRegistrationErrorMessageFromBnRegistrationState = (
  state: CustomDomainRecordBnRegistrationState,
): string | undefined => {
  if ('failed' in state) {
    return state.failed.error_message;
  }
  return undefined;
};
