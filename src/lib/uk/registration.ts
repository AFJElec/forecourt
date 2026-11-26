/** UK vehicle registration helpers (current 2001+ format plus older prefix/suffix/dateless). */

const CURRENT = /^[A-HJ-PR-Y]{2}[0-9]{2}[A-HJ-PR-Z]{3}$/; // e.g. AB12CDE (I, Q not used; Z only in random letters)
const PREFIX = /^[A-HJ-NP-Y][0-9]{1,3}[A-Z]{3}$/;          // e.g. A123BCD
const SUFFIX = /^[A-Z]{3}[0-9]{1,3}[A-HJ-NP-Y]$/;          // e.g. ABC123D
const DATELESS = /^([A-Z]{1,3}[0-9]{1,4}|[0-9]{1,4}[A-Z]{1,3})$/;

export function normaliseVrm(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidVrm(input: string): boolean {
  const v = normaliseVrm(input);
  if (v.length < 2 || v.length > 7) return false;
  return CURRENT.test(v) || PREFIX.test(v) || SUFFIX.test(v) || DATELESS.test(v);
}

/** Display with the standard space: AB12 CDE. */
export function formatVrm(input: string): string {
  const v = normaliseVrm(input);
  return CURRENT.test(v) || /^ZZ[0-9]{2}[A-Z]{3}$/.test(v) ? `${v.slice(0, 4)} ${v.slice(4)}` : v;
}

/** Age identifier for a first-registration date (current format, Sept 2001 onward). */
export function plateIdentifier(date: Date): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1; // 1–12
  if (m >= 3 && m <= 8) return String(y % 100).padStart(2, "0");
  if (m >= 9) return String((y % 100) + 50);
  return String(((y - 1) % 100) + 50); // Jan/Feb belong to previous Sept plate
}

/** Inverse: "71" → { from: 2021-09-01, to: 2022-02-28 } */
export function plateToDateRange(id: string): { from: Date; to: Date } | null {
  if (!/^[0-9]{2}$/.test(id)) return null;
  const n = Number(id);
  if (n >= 51) {
    const y = 2000 + (n - 50);
    return { from: new Date(Date.UTC(y, 8, 1)), to: new Date(Date.UTC(y + 1, 1, 28)) };
  }
  const y = 2000 + n;
  if (n === 0 || y < 2002) return null;
  return { from: new Date(Date.UTC(y, 2, 1)), to: new Date(Date.UTC(y, 7, 31)) };
}

export function registrationYearLabel(date: Date): string {
  return `${date.getUTCFullYear()} (${plateIdentifier(date)} reg)`;
}
