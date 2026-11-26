import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-[1.1em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-electric-500 text-white shadow-[0_6px_20px_-6px_rgb(47_116_255/0.7)] hover:bg-electric-600",
        secondary: "bg-ink-900 text-white hover:bg-ink-800",
        outline: "border border-mist-300 bg-white text-ink-900 hover:border-ink-900",
        ghost: "text-ink-900 hover:bg-mist-100",
        subtle: "bg-electric-50 text-electric-700 hover:bg-electric-100",
        inverse: "bg-white text-ink-900 hover:bg-mist-100",
        link: "text-electric-600 underline-offset-4 hover:underline px-0",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        md: "h-11 px-5 text-[15px]",
        lg: "h-13 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";
