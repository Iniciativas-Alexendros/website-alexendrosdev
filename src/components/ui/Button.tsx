"use client";

import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ComponentProps,
  ReactNode,
  Ref,
} from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { Size, Variant } from "@/tokens";

/**
 * Sistema de CTAs unificado (#162). Fuente de verdad única de botones:
 * prohibido estilar CTAs inline con clases ad-hoc; toda variante o estado
 * nuevo entra aquí.
 *
 * Uso:
 *   <Button variant="primary" type="submit">Enviar</Button>
 *   <ButtonLink variant="secondary" size="lg" href="/contacto">Hablemos</ButtonLink>
 *   const cls = buttonVariants({ variant: "ghost", size: "sm" });
 */

const baseStyles =
  "inline-flex min-h-10 items-center justify-center gap-1.5 font-semibold transition-[background-color,color,border-color,box-shadow,transform,filter] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus focus-visible:shadow-[0_0_0_3px_oklch(var(--border-focus)/0.25)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary border-none hover:brightness-110 hover:-translate-y-px hover:shadow-md",
  secondary: "bg-transparent text-foreground border border-border hover:bg-highlight",
  ghost: "bg-transparent text-text-secondary hover:text-foreground",
};

const sizeStyles: Record<Size, string> = {
  sm: "min-h-8 px-3 text-sm rounded-md",
  md: "h-10 px-4 text-sm rounded-interactive",
  lg: "h-12 px-6 text-base rounded-interactive",
};

export interface ButtonVariantsProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

/** Devuelve la cadena de clases para una variante/tamaño. `className` se fusiona al final. */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: ButtonVariantsProps = {}) {
  return cn(baseStyles, variantStyles[variant], sizeStyles[size], className);
}

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

/**
 * Botón nativo. Si se pasa `href` actúa como enlace (navegación full-page);
 * para CTAs de navegación interna usar <ButtonLink> (next/link).
 */
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

  const classNames = buttonVariants({ variant, size, className });

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

export interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
}

/** CTA de navegación basado en next/link (navegación client-side). */
const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, variant = "primary", size = "md", disabled, children, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        {...props}
        className={buttonVariants({
          variant,
          size,
          className: cn(className, disabled && "pointer-events-none opacity-50"),
        })}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : props.tabIndex}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          props.onClick?.(event);
        }}
      >
        {children}
      </Link>
    );
  },
);

ButtonLink.displayName = "ButtonLink";

export { Button, ButtonLink };
