import { Err as ApiError } from '@/declarations/backend/backend.did';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  GenericCandidEnum,
  ExtractKeysFromCandidEnum,
} from '@/lib/types/utils';
import { formatUnits, parseUnits } from '@ethersproject/units';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const appVersion = process.env.NEXT_PUBLIC_VERSION as string;

export const printVersionToConsole = () => {
  // eslint-disable-next-line no-console
  console.log('Version:', appVersion);
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

const getThousandSeparator = (locale?: Intl.LocalesArgument): string => {
  const numberWithDecimalSeparator = 1111.1;
  return (
    Intl.NumberFormat(locale)
      .formatToParts(numberWithDecimalSeparator)
      .find(part => part.type === 'group')?.value ?? ','
  );
};

export const getDecimalSeparator = (locale?: Intl.LocalesArgument): string => {
  const numberWithDecimalSeparator = 1.1;
  return (
    Intl.NumberFormat(locale)
      .formatToParts(numberWithDecimalSeparator)
      .find(part => part.type === 'decimal')?.value ?? '.'
  );
};

/**
 * Can be used together with `renderNumberWithDigits`, as it does the opposite.
 */
export const parseFormattedNumber = (
  value: string | number | null | undefined,
): number | undefined => {
  if (!value) {
    return undefined;
  }
  if (typeof value === 'number') {
    return value;
  }
  const rawValue = value.replace(getThousandSeparator(), '');
  const numericValue = parseFloat(rawValue); // if the string is an integer, this will return an integer number
  return isNaN(numericValue) ? undefined : numericValue;
};

/**
 * @param value the value to be formatted, which can also be the output of this function used as input again, e.g. in a form field.
 * @param digits the number of decimal places, defaults to 2
 * @returns a string formatted to 2 decimal places in US locale, e.g. *12345.67* -> *12,345.67*
 */
export const renderNumberWithDigits = (
  value: string | number | null | undefined,
  digits = 2,
): string | undefined => {
  if (!value) {
    return undefined;
  }
  const numericValue =
    typeof value === 'number' ? value : parseFormattedNumber(value);
  if (!numericValue || isNaN(numericValue)) {
    return undefined;
  }
  return numericValue.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export const candidOpt = <T>(opt: T | null | undefined): [] | [T] => {
  if (opt === null || opt === undefined) {
    return [];
  }
  return [opt];
};

export const formatBytes = (bytes: string | number, decimals = 2) => {
  bytes = +bytes;
  if (!bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    'Bytes',
    'KiB',
    'MiB',
    'GiB',
    'TiB',
    'PiB',
    'EiB',
    'ZiB',
    'YiB',
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const localFileToSrc = (
  file: File | string | null,
  fallbackSrc?: string,
): string => {
  if (!file) {
    return fallbackSrc || '';
  }

  if (typeof file === 'string') {
    return file;
  }

  return URL.createObjectURL(file);
};

export const fileFromBase64 = (
  base64String: string,
  fileName: string,
): File => {
  const mimeTypeMatch = base64String.match(/^data:(.*?);base64,/);
  if (!mimeTypeMatch) {
    throw new Error('Invalid base64 string');
  }
  const mimeType = mimeTypeMatch[1];

  // Decode the base64 string
  const base64Data = atob(base64String.split(',')[1]);
  const bytes = new Uint8Array(base64Data.length);
  for (let i = 0; i < base64Data.length; i++) {
    bytes[i] = base64Data.charCodeAt(i);
  }
  // Create a Blob from the bytes
  const blob = new Blob([bytes], { type: mimeType });

  return new File([blob], fileName, { type: mimeType });
};

export const fileFromUrl = async (url: string): Promise<File | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], url.split('/').pop() || '', { type: blob.type });
  } catch (e) {
    console.error('Failed to fetch file', e);
    return null;
  }
};

export const floatToBigInt = (val: number, decimals: number): bigint => {
  return parseUnits(val.toString(), decimals).toBigInt();
};

export const bigIntToFloat = (val: bigint, decimals: number): number => {
  const num = formatUnits(val.toString(), decimals);
  return parseFloat(num);
};
