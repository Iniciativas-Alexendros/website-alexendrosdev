"use client";

import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode, Ref } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { Variant, Size } from "@/tokens";

interface BaseButtonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
}

type ButtonButtonProps = BaseButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> & {
    href?: never;
    asChild?: boolean;
  };

type ButtonAnchorProps = BaseButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseButtonProps> & {
    href: string;
    asChild?: never;
  } & Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel">;

type ButtonProps = ButtonButtonProps | ButtonAnchorProps;

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>((props, ref) => {
  const {
    className,
    variant = "primary",
    size = "md",
    children,
    disabled,
    href,
    ...restProps
  } = props as ButtonAnchorProps;

  // Tokens from @theme — durations and easings are mapped to Tailwind utilities
  // via design-tokens.css @theme inline block
  const baseStyles =
    "inline-flex items-center justify-center font-semibold transition-all duration-fast ease-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/30 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

  const variantStyles: Record<"primary" | "secondary" | "ghost", string> = {
    primary:
      "bg-primary text-on-primary border-none hover:brightness-110 hover:-translate-y-px hover:shadow-md",
    secondary: "bg-transparent text-foreground border-border hover:bg-highlight",
    ghost: "bg-transparent text-text-secondary hover:text-foreground",
  };

  const sizeStyles: Record<"sm" | "md" | "lg", string> = {
    sm: "h-8 px-3 text-sm rounded-md",
    md: "h-10 px-4 text-sm rounded-interactive",
    lg: "h-12 px-6 text-base rounded-interactive",
  };

  const classNames = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);

  if (href) {
    // Render as anchor when href is provided
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        target={restProps.target}
        rel={restProps.rel}
        className={classNames}
        {...(restProps as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      className={classNames}
      disabled={disabled}
      {...(restProps as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export { Button };
