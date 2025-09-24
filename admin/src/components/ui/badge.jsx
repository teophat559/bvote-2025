import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import React from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-600 text-green-50 hover:bg-green-600/80",
        warning: "border-transparent bg-yellow-500 text-black hover:bg-yellow-500/80",
        info: "border-transparent bg-sky-500 text-white hover:bg-sky-500/80",
        test: "border-transparent bg-purple-500/80 text-purple-50 hover:bg-purple-500/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants };