"use client";
import { CheckCircle2, Eye, EyeOff, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { requestPasswordReset, sendMagicLink, signInWithPassword, signUp, updatePassword, type AuthState } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

const initial: AuthState = {};

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-xs text-danger-600">{msg}</p> : null;
}

function Done({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-success-50 p-5 text-success-600" role="status">
      <CheckCircle2 className="size-6" />
      <p className="mt-2 font-semibold">{message}</p>
    </div>
  );
}

function PasswordInput({ id, name, autoComplete, invalid }: { id: string; name: string; autoComplete: string; invalid?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} name={name} type={show ? "text" : "password"} autoComplete={autoComplete} required aria-invalid={invalid} className="pr-12" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:text-ink-900" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function SignInForm({ next, linkError }: { next: string; linkError?: boolean }) {
  const [mode, setMode] = useState<"password" | "link">("password");
  const [pwState, pwAction, pwPending] = useActionState(signInWithPassword, initial);
  const [linkState, linkAction, linkPending] = useActionState(sendMagicLink, initial);
  const state = mode === "password" ? pwState : linkState;
  if (mode === "link" && linkState.ok) return <Done message={linkState.message!} />;
  return (
    <div>
      {linkError && <p className="mb-4 rounded-xl bg-warn-50 p-3 text-sm text-warn-600">That link has expired or was already used. Please try again.</p>}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-mist-100 p-1 text-sm font-semibold" role="tablist">
        {(["password", "link"] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => setMode(m)}
            className={cn("rounded-lg py-2", mode === m ? "bg-white shadow-sm" : "text-muted")}>
            {m === "password" ? "Password" : "Email me a link"}
          </button>
        ))}
      </div>
      <form action={mode === "password" ? pwAction : linkAction} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={next} />
        <div><Label htmlFor="si-email">Email</Label><Input id="si-email" name="email" type="email" autoComplete="email" required aria-invalid={!!state.errors?.email} /><Err msg={state.errors?.email} /></div>
        {mode === "password" && (
          <div>
            <div className="flex items-baseline justify-between"><Label htmlFor="si-pw">Password</Label><Link href="/forgot-password" className="text-xs font-semibold text-electric-600">Forgot password?</Link></div>
            <PasswordInput id="si-pw" name="password" autoComplete="current-password" invalid={!!state.errors?.password} />
            <Err msg={state.errors?.password} />
          </div>
        )}
        {state.message && !state.ok && <p className="text-sm text-danger-600" role="alert">{state.message}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={pwPending || linkPending}>
          {mode === "link" && <Mail />}{pwPending || linkPending ? "Please wait…" : mode === "password" ? "Sign in" : "Send sign-in link"}
        </Button>
      </form>
    </div>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initial);
  if (state.ok) return <Done message={state.message!} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <div><Label htmlFor="su-name">Your name</Label><Input id="su-name" name="displayName" autoComplete="name" required aria-invalid={!!state.errors?.displayName} /><Err msg={state.errors?.displayName} /></div>
      <div><Label htmlFor="su-email">Email</Label><Input id="su-email" name="email" type="email" autoComplete="email" required aria-invalid={!!state.errors?.email} /><Err msg={state.errors?.email} /></div>
      <div>
        <Label htmlFor="su-pw">Password</Label>
        <PasswordInput id="su-pw" name="password" autoComplete="new-password" invalid={!!state.errors?.password} />
        {state.errors?.password ? <Err msg={state.errors.password} /> : <p className="mt-1 text-xs text-muted">At least 10 characters, with a letter and a number.</p>}
      </div>
      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" name="terms" className="mt-0.5 size-4 accent-electric-500" />
        <span>I agree to the <Link href="/legal/terms" className="font-semibold text-electric-600 underline">terms of use</Link> and have read the <Link href="/legal/privacy" className="font-semibold text-electric-600 underline">privacy notice</Link>.</span>
      </label>
      <Err msg={state.errors?.terms} />
      <label className="flex items-start gap-2.5 text-sm text-muted">
        <input type="checkbox" name="marketing" className="mt-0.5 size-4 accent-electric-500" />
        <span>Send me occasional news and offers by email (optional — you can unsubscribe at any time).</span>
      </label>
      {state.message && <p className="text-sm text-danger-600" role="alert">{state.message}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Creating account…" : "Create account"}</Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);
  if (state.ok) return <Done message={state.message!} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <div><Label htmlFor="fp-email">Email</Label><Input id="fp-email" name="email" type="email" autoComplete="email" required aria-invalid={!!state.errors?.email} /><Err msg={state.errors?.email} /></div>
      {state.message && <p className="text-sm text-danger-600" role="alert">{state.message}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initial);
  if (state.ok) return (<div className="space-y-4"><Done message={state.message!} /><Link href="/account" className="block text-center font-semibold text-electric-600">Go to my account</Link></div>);
  return (
    <form action={action} className="space-y-4" noValidate>
      <div><Label htmlFor="rp-pw">New password</Label><PasswordInput id="rp-pw" name="password" autoComplete="new-password" invalid={!!state.errors?.password} /><Err msg={state.errors?.password} /></div>
      <div><Label htmlFor="rp-confirm">Confirm new password</Label><PasswordInput id="rp-confirm" name="confirm" autoComplete="new-password" invalid={!!state.errors?.confirm} /><Err msg={state.errors?.confirm} /></div>
      {state.message && <p className="text-sm text-danger-600" role="alert">{state.message}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Saving…" : "Update password"}</Button>
    </form>
  );
}
