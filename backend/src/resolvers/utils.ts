/** Normalise an enum value to UPPERCASE (frontend may send lowercase). */
export const toEnum = <T extends string>(val: string | undefined | null, fallback: T): T =>
  (val ? val.toUpperCase() : fallback) as T;
