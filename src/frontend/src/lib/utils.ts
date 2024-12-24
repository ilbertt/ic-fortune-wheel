import { Err as ApiError } from '@/declarations/backend/backend.did';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  GenericCandidEnum,
  ExtractKeysFromCandidEnum,
} from '@/lib/types/utils';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const printVersionToConsole = () => {
  // eslint-disable-next-line no-console
  console.log('Version:', process.env.NEXT_PUBLIC_VERSION);
};

export const renderError = (err: ApiError): string =>
  `${err.message} (${err.code})`;

export const enumKey = <T extends GenericCandidEnum>(
  enumObj: T,
): ExtractKeysFromCandidEnum<T> => {
  return Object.keys(enumObj)[0] as ExtractKeysFromCandidEnum<T>;
};

export const toCandidEnum = <T extends GenericCandidEnum>(
  key: ExtractKeysFromCandidEnum<T>,
  val = null,
): T => {
  return { [key]: val } as T;
};

export const renderUsdValue = (usdValue: number): string => {
  return usdValue.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  });
};
