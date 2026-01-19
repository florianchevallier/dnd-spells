import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-amber-600 text-white shadow",
        secondary:
          "border-transparent bg-stone-700 text-stone-200",
        destructive:
          "border-transparent bg-red-900 text-red-100 shadow",
        outline: "border-stone-700 text-stone-300",
        level:
          "border-amber-800/50 bg-amber-950/50 text-amber-400",
        ritual:
          "border-blue-800/50 bg-blue-950/50 text-blue-400",
        concentration:
          "border-purple-800/50 bg-purple-950/50 text-purple-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
