import Link from "next/link";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  variant?: Variant;
  children: ReactNode;
  href?: string;
  onClick?: MouseEventHandler;
  style?: CSSProperties;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  target?: string;
  rel?: string;
}

export function Button({
  variant = "primary",
  children,
  href,
  onClick,
  style,
  type,
  disabled,
  className = "",
  ...rest
}: ButtonProps) {
  const cls = `ak-btn ak-btn-${variant} ${className}`.trim();

  if (href) {
    const internal = href.startsWith("/");
    if (internal) {
      return (
        <Link className={cls} href={href} style={style} {...rest}>
          {children}
        </Link>
      );
    }
    return (
      <a className={cls} href={href} style={style} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button
      className={cls}
      onClick={onClick}
      style={style}
      type={type ?? "button"}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
