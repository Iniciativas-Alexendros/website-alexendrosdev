import type { HTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { shadow, radius, duration } from "@/tokens";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padded?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, padded = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-elevated border border-border-subtle rounded-xl shadow-sm transition-all duration-base",
          interactive && "hover:shadow-lg hover:border-border hover:-translate-y-1 cursor-pointer",
          padded && "p-6",
          className,
        )}
        style={{
          // Referencia explícita a tokens desde @/tokens para consumo JS
          boxShadow: interactive ? undefined : shadow.sm,
          transitionDuration: duration.base,
        }}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export { Card };
