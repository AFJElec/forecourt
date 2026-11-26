"use client";
import { Calendar, CheckCircle2, Flag, MessageSquare, Phone, Repeat, Share2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { postJson } from "@/lib/search/client";
import { cn } from "@/lib/utils";
import { CompareButton } from "./compare-button";
import { SaveButton } from "./save-button";

type Kind = "contact" | "viewing" | "part_exchange";
const tabs: { k: Kind; label: string; icon: typeof MessageSquare }[] = [
  { k: "contact", label: "Message", icon: MessageSquare },
  { k: "viewing", label: "Viewing", icon: Calendar },
  { k: "part_exchange", label: "Part-exchange", icon: Repeat },
];

export function ContactPanel({ advertId, dealerId, title, phone, sellerName, isDemo, id = "contact" }: {
  advertId?: string; dealerId?: string; title: string; phone: string | null; sellerName: string; isDemo: boolean; id?: string;
}) {
  const general = !advertId;
  const [kind, setKind] = useState<Kind>("contact");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [result, setResult] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reveal, setReveal] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setState("sending"); setErrors({});
    const { ok, data } = await postJson("/api/enquiries", { ...fd, kind, advertisementId: advertId, dealershipId: dealerId });
    if (!ok) {
      setErrors((data.fieldErrors as Record<string, string>) ?? {});
      setResult(String(data.error ?? "Please check the form and try again."));
      setState("error");
      return;
    }
    setResult(data.delivered ? `Your enquiry has been sent to ${sellerName}.` : String(data.message ?? "Enquiry received."));
    setState("done");
  };

  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20 rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-mist-200/70 sm:p-6">
      <h2 id={`${id}-h`} className="text-xl font-bold">Contact {sellerName}</h2>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {phone ? (
          reveal
            ? <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-ink-900 text-[15px] font-semibold text-white"><Phone className="size-4" />{phone}</a>
            : <Button variant="secondary" onClick={() => setReveal(true)}><Phone /> Call seller</Button>
        ) : <Button variant="outline" disabled>No phone listed</Button>}
        {advertId ? <SaveButton id={advertId} label={title} variant="inline" /> : <a href="#reviews" className="flex h-11 items-center justify-center rounded-[var(--radius-control)] border border-mist-300 text-[15px] font-semibold text-ink-900">Reviews</a>}
      </div>

      {state === "done" ? (
        <div className="mt-5 rounded-2xl bg-success-50 p-5 text-success-600">
          <CheckCircle2 className="size-6" />
          <p className="mt-2 font-semibold">{result}</p>
          <button className="mt-3 text-sm font-semibold underline" onClick={() => setState("idle")}>Send another enquiry</button>
        </div>
      ) : (
        <>
          <div className={cn("mt-5 grid gap-1", general ? "grid-cols-2" : "grid-cols-3", " rounded-xl bg-mist-100 p-1")} role="tablist">
            {tabs.filter((t) => !general || t.k !== "viewing").map(({ k, label, icon: Icon }) => (
              <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)}
                className={cn("flex items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-semibold transition", kind === k ? "bg-white text-ink-900 shadow-sm" : "text-muted")}>
                <Icon className="size-4" />{label}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label htmlFor={`${id}-name`}>Name</Label><Input id={`${id}-name`} name="name" autoComplete="name" required aria-invalid={!!errors.name} />{errors.name && <p className="mt-1 text-xs text-danger-600">{errors.name}</p>}</div>
              <div><Label htmlFor={`${id}-phone`}>Phone (optional)</Label><Input id={`${id}-phone`} name="phone" type="tel" autoComplete="tel" /></div>
            </div>
            <div><Label htmlFor={`${id}-email`}>Email</Label><Input id={`${id}-email`} name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} />{errors.email && <p className="mt-1 text-xs text-danger-600">{errors.email}</p>}</div>
            {kind === "viewing" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label htmlFor={`${id}-date`}>Preferred date</Label><Input id={`${id}-date`} name="preferredDate" type="date" required /></div>
                <div><Label htmlFor={`${id}-time`}>Time of day</Label><Select id={`${id}-time`} name="preferredTime"><option>Morning</option><option>Afternoon</option><option>Evening</option></Select></div>
              </div>
            )}
            {kind === "part_exchange" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label htmlFor={`${id}-pxreg`}>Your registration</Label><Input id={`${id}-pxreg`} name="pxRegistration" className="uppercase" placeholder="AB12 CDE" required aria-invalid={!!errors.pxRegistration} />{errors.pxRegistration && <p className="mt-1 text-xs text-danger-600">{errors.pxRegistration}</p>}</div>
                <div><Label htmlFor={`${id}-pxmiles`}>Mileage</Label><Input id={`${id}-pxmiles`} name="pxMileage" inputMode="numeric" required /></div>
              </div>
            )}
            <div>
              <Label htmlFor={`${id}-msg`}>Message</Label>
              <Textarea id={`${id}-msg`} name="message" rows={3} defaultValue={general ? (kind === "part_exchange" ? "Hi, I'd like a part-exchange valuation for my car." : "Hi, I'd like some more information about your stock.") : kind === "viewing" ? `Hi, I'd like to arrange a viewing of the ${title}.` : kind === "part_exchange" ? `Hi, I'm interested in the ${title} and would like a part-exchange price for my car.` : `Hi, is the ${title} still available?`} key={kind} />
            </div>
            {state === "error" && <p className="text-sm text-danger-600" role="alert">{result}</p>}
            <Button type="submit" className="w-full" disabled={state === "sending"}>{state === "sending" ? "Sending…" : kind === "viewing" ? "Request viewing" : kind === "part_exchange" ? "Request part-exchange price" : "Send message"}</Button>
            <p className="text-xs leading-relaxed text-muted">
              Your details go only to this seller to answer your enquiry. See our <a className="underline" href="/legal/privacy">privacy notice</a>.
              {isDemo && " This is a demo listing — enquiries are validated but not sent to anyone."}
            </p>
          </form>
        </>
      )}
      <p className="mt-4 rounded-xl bg-mist-100 px-3.5 py-2.5 text-xs text-slate-ink">
        <strong>In-app messaging</strong> (conversation inbox) arrives in build phase 5. Enquiries above are logged now.
      </p>
    </section>
  );
}

export function ShareReport({ advertId, title }: { advertId: string; title: string }) {
  const [msg, setMsg] = useState("");
  const [reporting, setReporting] = useState(false);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title, url: location.href });
      else { await navigator.clipboard.writeText(location.href); setMsg("Link copied"); }
    } catch { /* cancelled */ }
  };
  const report = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    const { ok, data } = await postJson("/api/reports", { ...fd, advertisementId: advertId });
    setMsg(ok ? String(data.message ?? "Thanks — our team will review this advert.") : "Couldn't send report. Please try again.");
    setReporting(false);
  };
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <CompareButton id={advertId} />
      <Button variant="ghost" size="sm" onClick={share}><Share2 /> Share</Button>
      <Button variant="ghost" size="sm" onClick={() => setReporting((x) => !x)} aria-expanded={reporting}><Flag /> Report advert</Button>
      {msg && <span className="text-success-600" role="status">{msg}</span>}
      {reporting && (
        <form onSubmit={report} className="mt-2 w-full space-y-2 rounded-xl border border-mist-200 bg-white p-4">
          <Label htmlFor="rep-reason">What's wrong with this advert?</Label>
          <Select id="rep-reason" name="reason" required defaultValue="">
            <option value="" disabled>Choose a reason</option>
            <option value="scam">Looks like a scam</option><option value="incorrect_details">Incorrect details</option>
            <option value="stolen">May be stolen</option><option value="sold">Vehicle already sold</option>
            <option value="duplicate">Duplicate advert</option><option value="offensive">Offensive content</option><option value="other">Other</option>
          </Select>
          <Textarea name="details" rows={2} placeholder="Tell us more (optional)" />
          <Button size="sm" type="submit">Submit report</Button>
        </form>
      )}
    </div>
  );
}
