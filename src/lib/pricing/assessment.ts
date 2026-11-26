/**
 * Price assessment from comparable ACTIVE listings in our own database.
 * No badge is shown unless there are enough comparables
 * (PRICE_ASSESSMENT_MIN_COMPARABLES) — we never invent market data.
 *
 * Method: comparables = same make + model, first-registered within ±2 years.
 * Each comparable's price is normalised to the subject's age and mileage
 * using a simple depreciation curve, then we compare against the median.
 */
import { PRICE_ASSESSMENT_MIN_COMPARABLES } from "@/config/site";
import type { PriceAssessment } from "@/types/vehicle";

export interface PricePoint { id: string; makeModel: string; year: number; mileage: number; price: number }

const YEARLY_DEPRECIATION = 0.86;
const PER_THOUSAND_MILES = 0.004;

function normalise(c: PricePoint, target: PricePoint): number {
  const ageFactor = Math.pow(YEARLY_DEPRECIATION, target.year < c.year ? c.year - target.year : -(target.year - c.year));
  const mileageFactor = 1 - ((target.mileage - c.mileage) / 1000) * PER_THOUSAND_MILES;
  return c.price * ageFactor * Math.min(1.25, Math.max(0.75, mileageFactor));
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export interface AssessmentResult {
  assessment: PriceAssessment;
  comparableCount: number;
  marketMedian: number;
  differencePct: number;
}

export function assessPrice(subject: PricePoint, market: PricePoint[], minComparables = PRICE_ASSESSMENT_MIN_COMPARABLES): AssessmentResult | null {
  const comps = market.filter((c) => c.id !== subject.id && c.makeModel === subject.makeModel && Math.abs(c.year - subject.year) <= 2);
  if (comps.length < minComparables) return null;
  const med = median(comps.map((c) => normalise(c, subject)));
  const diff = (subject.price - med) / med;
  const assessment: PriceAssessment = diff <= -0.08 ? "excellent" : diff <= -0.03 ? "good" : diff <= 0.05 ? "fair" : "above";
  return { assessment, comparableCount: comps.length, marketMedian: Math.round(med), differencePct: Math.round(diff * 1000) / 10 };
}

export const ASSESSMENT_LABELS: Record<PriceAssessment, string> = {
  excellent: "Excellent price",
  good: "Good price",
  fair: "Fair price",
  above: "Above market average",
};
