export type GenericCandidEnum = { [key: string]: unknown };

export type ExtractKeysFromCandidEnum<T> = T extends GenericCandidEnum
  ? keyof T
  : never;

export type DropdownElement = {
  value: string;
  label: React.ReactNode;
};
