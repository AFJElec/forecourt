import { ChevronDown } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const control =
  "h-12 w-full rounded-[var(--radius-control)] border border-mist-300 bg-white px-3.5 text-[15px] text-ink-900 transition-colors placeholder:text-muted hover:border-ink-600 focus:border-electric-500 focus:outline-none focus:ring-4 focus:ring-electric-500/15 disabled:bg-mist-100 disabled:text-muted";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(control, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(control, "h-auto min-h-28 py-3", className)} {...props} />
));
Textarea.displayName = "Textarea";

/** Native select: best accessibility + native pickers on mobile. */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select ref={ref} className={cn(control, "appearance-none pr-10", className)} {...props}>
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
  </div>
));
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-[13px] font-semibold text-ink-900", className)} {...props} />;
}

/** Toggle chip used for multi-select filters. */
export function Chip({ active, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
        active ? "border-electric-500 bg-electric-50 text-electric-700" : "border-mist-300 bg-white text-slate-ink hover:border-ink-600",
        className,
      )}
      {...props}
    />
  );
}
