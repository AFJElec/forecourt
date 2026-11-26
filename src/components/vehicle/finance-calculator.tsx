"use client";
import { Info } from "lucide-react";
import { useMemo, useState } from "react";
import { Label } from "@/components/ui/field";
import { calculateFinance, financeDefaults } from "@/lib/finance/representative";
import { formatMoney, formatPrice } from "@/lib/format";

/**
 * Budget calculator — ILLUSTRATIVE ONLY. No lender, no credit search, no "apply".
 * A regulated quote/apply journey must only be enabled once the FCA permissions
 * or arrangements noted in docs/ARCHITECTURE.md are in place.
 */
export function FinanceCalculator({ price }: { price: number }) {
  const [deposit, setDeposit] = useState(Math.round((price * financeDefaults.depositPct) / 100 / 50) * 50);
  const [term, setTerm] = useState<number>(financeDefaults.termMonths);
  const [apr, setApr] = useState<number>(financeDefaults.apr);
  const r = useMemo(() => calculateFinance({ price, deposit, termMonths: term, apr }), [price, deposit, term, apr]);
  const maxDeposit = Math.max(0, price - 500);

  return (
    <section aria-labelledby="fin-h" className="rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-mist-200/70 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 id="fin-h" className="text-xl font-bold">Budget calculator</h2>
        <span className="rounded-full bg-warn-50 px-2.5 py-0.5 text-xs font-semibold text-warn-600">Illustrative</span>
      </div>
      <div className="mt-5 space-y-5">
        <div>
          <div className="flex justify-between"><Label htmlFor="fc-dep">Deposit</Label><span className="tabular text-sm font-semibold">{formatPrice(deposit)}</span></div>
          <input id="fc-dep" type="range" min={0} max={maxDeposit} step={50} value={Math.min(deposit, maxDeposit)} onChange={(e) => setDeposit(Number(e.target.value))} className="w-full accent-electric-500" />
        </div>
        <div>
          <Label>Term</Label>
          <div className="grid grid-cols-5 gap-1.5">
            {[24, 36, 48, 60, 72].map((t) => (
              <button key={t} type="button" onClick={() => setTerm(t)} aria-pressed={term === t}
                className={`h-10 rounded-lg text-sm font-semibold ${term === t ? "bg-ink-900 text-white" : "bg-mist-100 text-slate-ink hover:bg-mist-200"}`}>{t}m</button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between"><Label htmlFor="fc-apr">Assumed APR</Label><span className="tabular text-sm font-semibold">{apr.toFixed(1)}%</span></div>
          <input id="fc-apr" type="range" min={0} max={25} step={0.1} value={apr} onChange={(e) => setApr(Number(e.target.value))} className="w-full accent-electric-500" />
        </div>
      </div>
      <div className="mt-6 rounded-2xl bg-ink-900 p-5 text-white">
        <p className="text-sm text-white/70">Estimated monthly payment</p>
        <p className="tabular mt-1 text-4xl font-extrabold tracking-tight">{formatMoney(r.monthly)}</p>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-white/60">Amount of credit</dt><dd className="tabular text-right font-semibold">{formatMoney(r.amountOfCredit)}</dd>
          <dt className="text-white/60">Total interest</dt><dd className="tabular text-right font-semibold">{formatMoney(r.totalInterest)}</dd>
          <dt className="text-white/60">Total payable</dt><dd className="tabular text-right font-semibold">{formatMoney(r.totalPayable)}</dd>
        </dl>
      </div>
      <p className="mt-4 flex gap-2 text-xs leading-relaxed text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        A simple budgeting estimate using the figures above. It is not a quote or an offer of credit, and the rate you could be offered depends on your circumstances. We do not currently arrange finance.
      </p>
    </section>
  );
}
