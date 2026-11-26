"use client";
import { Download, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { updateProfile, type ProfileState } from "@/lib/account/actions";

export interface ProfileData {
  email: string; displayName: string; firstName: string; lastName: string; phone: string; postcode: string;
  marketing: boolean; prefs: { email: boolean; price_drops: boolean; saved_searches: boolean };
}

function Toggle({ name, label, hint, defaultChecked, disabled }: { name: string; label: string; hint?: string; defaultChecked?: boolean; disabled?: boolean }) {
  return (
    <label className={`flex items-center justify-between gap-4 rounded-xl border border-mist-200 px-4 py-3 ${disabled ? "opacity-60" : ""}`}>
      <span><span className="block font-semibold text-ink-900">{label}</span>{hint && <span className="block text-xs text-muted">{hint}</span>}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} disabled={disabled} className="size-5 shrink-0 accent-electric-500" />
    </label>
  );
}

export function SettingsForm({ profile }: { profile: ProfileData }) {
  const [state, action, pending] = useActionState(updateProfile, {} as ProfileState);
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-8" noValidate>
      <section className="space-y-4">
        <h2 className="text-lg font-bold">Personal details</h2>
        <div><Label>Email</Label><Input value={profile.email} disabled readOnly /></div>
        <div><Label htmlFor="displayName">Display name</Label><Input id="displayName" name="displayName" defaultValue={profile.displayName} aria-invalid={!!e.displayName} />{e.displayName && <p className="mt-1 text-xs text-danger-600">{e.displayName}</p>}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="firstName">First name</Label><Input id="firstName" name="firstName" autoComplete="given-name" defaultValue={profile.firstName} /></div>
          <div><Label htmlFor="lastName">Last name</Label><Input id="lastName" name="lastName" autoComplete="family-name" defaultValue={profile.lastName} /></div>
          <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={profile.phone} aria-invalid={!!e.phone} />{e.phone && <p className="mt-1 text-xs text-danger-600">{e.phone}</p>}</div>
          <div><Label htmlFor="postcode">Home postcode</Label><Input id="postcode" name="postcode" autoComplete="postal-code" className="uppercase" defaultValue={profile.postcode} aria-invalid={!!e.postcode} />{e.postcode ? <p className="mt-1 text-xs text-danger-600">{e.postcode}</p> : <p className="mt-1 text-xs text-muted">Used to show distances. Never shown to sellers.</p>}</div>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Notifications</h2>
        <Toggle name="prefPriceDrops" label="Price drops on saved vehicles" defaultChecked={profile.prefs.price_drops} />
        <Toggle name="prefSavedSearches" label="New cars matching saved searches" hint="Choose how often per search on your Saved page" defaultChecked={profile.prefs.saved_searches} />
        <Toggle name="prefEmail" label="Also send these by email" hint="Email delivery switches on in build phase 5" defaultChecked={profile.prefs.email} />
        <Toggle name="prefPush" label="Push notifications on this device" hint="Coming in build phase 5" disabled />
        <Toggle name="marketing" label="News and offers by email" hint="Optional. You can unsubscribe at any time." defaultChecked={profile.marketing} />
      </section>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
        {state.message && <span role="status" className={state.ok ? "text-sm font-semibold text-success-600" : "text-sm text-danger-600"}>{state.message}</span>}
      </div>
    </form>
  );
}

export function PrivacyControls() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const del = async () => {
    const res = await fetch("/api/me/delete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm }) });
    if (res.ok) { try { ["saved", "recent", "searches", "compare"].forEach((k) => localStorage.removeItem(`fc:${k}`)); } catch { /* ignore */ } location.href = "/"; }
    else setMsg(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Couldn't delete your account.");
  };
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">Your data</h2>
      <a href="/api/me/export" className="flex items-center justify-between rounded-xl border border-mist-200 px-4 py-3 hover:border-ink-600">
        <span><span className="block font-semibold text-ink-900">Download my data</span><span className="block text-xs text-muted">A copy of everything we hold about you (JSON)</span></span>
        <Download className="size-5 text-muted" />
      </a>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-between rounded-xl border border-danger-600/30 px-4 py-3 text-left text-danger-600 hover:bg-danger-50">
          <span><span className="block font-semibold">Delete my account</span><span className="block text-xs">Permanently removes your account, saved items and any private adverts</span></span>
          <Trash2 className="size-5" />
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-danger-600/30 bg-danger-50 p-4">
          <p className="text-sm text-danger-600"><strong>This can't be undone.</strong> Your account, saved vehicles, saved searches, notifications and any private adverts will be permanently deleted. Type <strong>DELETE</strong> to confirm.</p>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="Type DELETE to confirm" autoComplete="off" />
          <div className="flex gap-2">
            <Button type="button" className="bg-danger-600 hover:bg-danger-600/90" disabled={confirm !== "DELETE"} onClick={del}>Delete permanently</Button>
            <Button type="button" variant="outline" onClick={() => { setOpen(false); setConfirm(""); }}>Cancel</Button>
          </div>
          {msg && <p className="text-sm text-danger-600" role="alert">{msg}</p>}
        </div>
      )}
    </section>
  );
}
