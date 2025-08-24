import { type Agent } from '@icp-sdk/core/agent';
import { IcrcLedgerCanister } from '@dfinity/ledger-icrc';
import { Principal } from '@icp-sdk/core/principal';

export const getLedgerActor = (canisterId: Principal, agent: Agent) => {
  return IcrcLedgerCanister.create({
    canisterId,
    agent,
  });
};
