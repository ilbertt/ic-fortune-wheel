import { type ColumnDef } from '@tanstack/react-table';

export type GenericCandidEnum = { [key: string]: unknown };

export type ExtractKeysFromCandidEnum<T> = T extends GenericCandidEnum
  ? keyof T
  : never;

export type DropdownElement = {
  value: string;
  label: React.ReactNode;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericColumnDef<T> = ColumnDef<T, any>;
