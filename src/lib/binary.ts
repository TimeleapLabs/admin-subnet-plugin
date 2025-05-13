import { Binary } from "mongodb";

export const equal = (
  a: Binary | Uint8Array,
  b: Binary | Uint8Array,
): boolean => {
  if (a instanceof Binary) {
    return equal(a.buffer, b);
  }

  if (b instanceof Binary) {
    return equal(a, b.buffer);
  }

  return a.length === b.length && a.every((v, i) => v === b[i]);
};
