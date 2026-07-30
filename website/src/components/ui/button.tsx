import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-accent-ink text-white shadow-card hover:-translate-y-px hover:brightness-110 active:translate-y-0",
        secondary:
          "border border-ink/20 bg-transparent text-ink hover:bg-surface-2",
        ghost:
          "text-accent-ink underline decoration-accent-wash decoration-2 underline-offset-4 hover:decoration-accent-ink",
        inverse:
          "bg-paper text-ink shadow-card hover:-translate-y-px hover:brightness-95",
      },
      size: {
        sm: "px-3.5 py-2 text-[13px]",
        md: "px-5 py-2.5",
        lg: "px-6 py-3.5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
