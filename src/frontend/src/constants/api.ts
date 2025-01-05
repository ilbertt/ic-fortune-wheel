import { canisterId } from '@/declarations/backend';
import { Principal } from '@dfinity/principal';

export const backendCanisterId = Principal.fromText(canisterId);
