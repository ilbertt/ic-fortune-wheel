import { Agent } from '@dfinity/agent';
import { IcrcLedgerCanister } from '@dfinity/ledger-icrc';
import { Principal } from '@dfinity/principal';

export const getLedgerActor = (canisterId: Principal, agent: Agent) => {
  return IcrcLedgerCanister.create({
    canisterId,
    agent,
  });
};
