import { z } from 'zod';

export type GenericCandidEnum = { [key: string]: unknown };

export type ExtractKeysFromCandidEnum<T> = T extends GenericCandidEnum
  ? keyof T
  : never;

export type DropdownElement = {
  value: string;
  label: React.ReactNode;
};

export type ZodProperties<T> = Required<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof T]: z.ZodType<T[K], any, any>;
}>;
