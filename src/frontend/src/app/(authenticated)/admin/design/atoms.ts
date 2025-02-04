import { atom } from 'jotai';

export const wheelAtom = atom<{ extractPrizeIndex: number | null }>({
  extractPrizeIndex: null,
});
