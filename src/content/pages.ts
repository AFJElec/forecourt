import { brand } from "@/config/brand";

/**
 * DRAFT content. Legal pages are placeholders and MUST be replaced with
 * text reviewed by a solicitor before launch. Admin-editable copies live in
 * public.content_pages (Phase 6).
 */
export const contentPages: Record<string, { title: string; draft: boolean; sections: { h?: string; p: string }[] }> = {
  about: { title: `About ${brand.name}`, draft: false, sections: [
    { p: `${brand.name} is a UK automotive marketplace connecting buyers with dealers and private sellers. We focus on honest information: clear trade/private labelling, write-off disclosures and price insight only where there's enough market data to support it.` },
  ] },
  "help/safety": { title: "Buying safely", draft: false, sections: [
    { h: "See the car and the paperwork", p: "Always view the vehicle in person, at the address on the V5C logbook. Check the VIN on the car matches the V5C." },
    { h: "Never pay a deposit to 'secure' a car you haven't seen", p: "Be wary of sellers who can't meet, ask for bank transfers to third parties, or pressure you to act fast." },
    { h: "Check the history", p: "Check MOT history on GOV.UK and consider a full provenance check for outstanding finance, theft and write-off records." },
    { h: "Private vs trade", p: "Dealers must meet the Consumer Rights Act 2015 (satisfactory quality, fit for purpose, as described). Private sellers must only describe the car accurately and have the right to sell it." },
  ] },
  "legal/terms": { title: "Terms of use", draft: true, sections: [{ p: "Placeholder. Terms of use covering advertisers, buyers, acceptable use, moderation, liability and governing law (England & Wales) are required before launch." }] },
  "legal/privacy": { title: "Privacy notice", draft: true, sections: [{ p: `Placeholder UK GDPR privacy notice for ${brand.legalName}. Must cover: controller identity, lawful bases, data shared with sellers when you enquire, processors (Supabase, Stripe, Resend, Vercel), retention, international transfers, and your rights including access and erasure. ICO registration required.` }] },
  "legal/cookies": { title: "Cookie policy", draft: true, sections: [{ p: "Placeholder. Essential cookies keep you signed in and remember your cookie choice. Analytics and marketing cookies are only set if you opt in via the cookie banner." }] },
};
