import { Principal } from '@dfinity/principal';
import { z } from 'zod';

export const PrincipalSchema = z.preprocess((val, ctx) => {
  try {
    return Principal.from(val);
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Not a valid principal',
    });

    // Special symbol to not affect the
    // inferred return type.
    return z.NEVER;
  }
}, z.custom<Principal>());

export const FileSchema = z.instanceof(File);
export const OptionalFileSchema = FileSchema.optional();

export const AssetNameSchema = z.string().min(1).max(100);
export const AssetTotalAmountSchema = z.coerce.number().min(0).max(1_000);
