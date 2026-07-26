import { Matches, ValidationOptions } from 'class-validator';

/** Accepts any 8-4-4-4-12 hex UUID, including non-RFC seed ids used in DEV. */
export const UUID_STRING_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function IsUuidString(validationOptions?: ValidationOptions) {
  return Matches(UUID_STRING_RE, {
    message: '$property must be a UUID',
    ...validationOptions,
  });
}
