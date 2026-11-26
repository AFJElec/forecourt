/**
 * TEMPORARY BRANDING — the business name has not been decided.
 * Every user-facing occurrence of the brand reads from this file
 * (plus public/manifest icons and the logo mark in components/layout/logo.tsx).
 * Change it here and it changes everywhere.
 */
export const brand = {
  name: "Forecourt",
  legalName: "Forecourt Marketplace Ltd (placeholder)",
  tagline: "The UK's home of better car buying",
  domain: "forecourt.example.co.uk",
  supportEmail: "support@forecourt.example.co.uk",
  /** FCA firm reference — leave null until authorised / appointed rep arrangement is in place. */
  fcaFirmReference: null as string | null,
  companyNumber: "00000000 (placeholder)",
  registeredAddress: "Registered office address (placeholder), United Kingdom",
  social: { x: "#", facebook: "#", instagram: "#", youtube: "#" },
} as const;

export type Brand = typeof brand;
