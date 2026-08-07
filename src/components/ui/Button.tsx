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
  };

type ButtonAnchorProps = BaseButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseButtonProps> & {
    href: string;
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
    "inline-flex items-center justify-center font-semibold transition-[background-color,color,border-color,box-shadow,transform,filter] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

  const variantStyles: Record<Variant, string> = {
    primary:
      "bg-primary text-on-primary border-none hover:brightness-110 hover:-translate-y-px hover:shadow-md",
    secondary: "bg-transparent text-foreground border-border hover:bg-highlight",
    ghost: "bg-transparent text-text-secondary hover:text-foreground",
    outline:
      "bg-transparent text-foreground border-2 border-primary hover:bg-primary hover:text-on-primary hover:-translate-y-px",
  };

  const sizeStyles: Record<"sm" | "md" | "lg", string> = {
    sm: "h-8 px-3 text-sm rounded-md",
    md: "h-10 px-4 text-sm rounded-interactive",
    lg: "h-12 px-6 text-base rounded-interactive",
  };

  const classNames = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);

  if (href) {
    // An anchor cannot be disabled natively; block pointer and keyboard activation.
    const anchorProps = restProps as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        target={anchorProps.target}
        rel={anchorProps.rel}
        aria-disabled={disabled || undefined}
        className={classNames}
        {...anchorProps}
        href={disabled ? undefined : href}
        tabIndex={disabled ? -1 : anchorProps.tabIndex}
        onClick={(event) => {
          anchorProps.onClick?.(event);
          if (disabled) event.preventDefault();
        }}
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
