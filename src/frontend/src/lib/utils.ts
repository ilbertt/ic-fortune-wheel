import { Err as ApiError } from '@/declarations/backend/backend.did';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const printVersionToConsole = () => {
  // eslint-disable-next-line no-console
  console.log('Version:', process.env.NEXT_PUBLIC_VERSION);
};

export const renderError = (err: ApiError): string =>
  `${err.message} (${err.code})`;
