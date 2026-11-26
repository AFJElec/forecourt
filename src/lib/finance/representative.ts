/**
 * ILLUSTRATIVE finance maths only.
 *
 * FCA note: displaying finance figures that promote credit is a financial
 * promotion. Until the platform has the appropriate permissions (or an
 * appointed-representative / introducer arrangement with an authorised
 * lender or broker), figures are shown as a budgeting aid, clearly labelled
 * "illustrative — not a finance offer", with no "apply" action.
 * The `regulatedFinanceEnabled` flag gates any future quote/apply flow.
 */

export const financeDefaults = {
  /** Illustrative APR %. Configurable in platform_settings('finance.representative_apr'). */
  apr: 9.9,
  termMonths: 48,
  depositPct: 10,
  minPrice: 2500,
  regulatedFinanceEnabled: false,
} as const;

export interface FinanceInput {
  price: number;
  deposit?: number;
  termMonths?: number;
  apr?: number;
}

export interface FinanceResult {
  monthly: number;
  deposit: number;
  amountOfCredit: number;
  totalInterest: number;
  totalPayable: number;
  termMonths: number;
  apr: number;
}

/** Hire-purchase style amortised repayment. */
export function calculateFinance({ price, deposit, termMonths = financeDefaults.termMonths, apr = financeDefaults.apr }: FinanceInput): FinanceResult {
  const dep = Math.min(Math.max(deposit ?? Math.round((price * financeDefaults.depositPct) / 100), 0), price);
  const credit = price - dep;
  const r = Math.pow(1 + apr / 100, 1 / 12) - 1;
  const monthly = r === 0 ? credit / termMonths : (credit * r) / (1 - Math.pow(1 + r, -termMonths));
  const totalRepaid = monthly * termMonths;
  return {
    monthly: Math.round(monthly * 100) / 100,
    deposit: dep,
    amountOfCredit: credit,
    totalInterest: Math.round((totalRepaid - credit) * 100) / 100,
    totalPayable: Math.round((totalRepaid + dep) * 100) / 100,
    termMonths,
    apr,
  };
}

export function illustrativeMonthly(price: number): number | null {
  if (price < financeDefaults.minPrice) return null;
  return Math.round(calculateFinance({ price }).monthly);
}

/** Inverse: the highest cash price whose illustrative monthly ≤ budget (used by "monthly budget" search). */
export function maxPriceForMonthly(monthlyBudget: number, termMonths = financeDefaults.termMonths, apr = financeDefaults.apr): number {
  const r = Math.pow(1 + apr / 100, 1 / 12) - 1;
  const credit = r === 0 ? monthlyBudget * termMonths : (monthlyBudget * (1 - Math.pow(1 + r, -termMonths))) / r;
  // price = credit / (1 - depositPct)
  return Math.floor(credit / (1 - financeDefaults.depositPct / 100));
}
