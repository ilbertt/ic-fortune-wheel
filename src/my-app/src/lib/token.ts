import { DEFAULT_TOKENS, type DefaultTokensKey } from '@/constants/token';
import { Principal } from '@dfinity/principal';

export const getDefaultToken = (
  ledgerCanisterId: Principal,
):
  | [DefaultTokensKey, (typeof DEFAULT_TOKENS)[DefaultTokensKey]]
  | undefined => {
  const entry = Object.entries(DEFAULT_TOKENS).find(
    ([, token]) =>
      token.ledger_config.ledger_canister_id.compareTo(ledgerCanisterId) ===
      'eq',
  );
  return entry ? [entry[0] as DefaultTokensKey, entry[1]] : undefined;
};

export const isDefaultToken = (ledgerCanisterId: Principal): boolean => {
  return Boolean(getDefaultToken(ledgerCanisterId));
};
