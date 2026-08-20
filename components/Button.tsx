import Link from "next/link";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand text-white border-brand hover:bg-brand-dark hover:border-brand-dark",
  outline: "bg-transparent text-ink-mid border-border hover:bg-cream2 hover:border-brand-mid",
  ghost: "bg-transparent text-ink-soft border-transparent hover:bg-cream2 hover:border-border",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-7 py-3 text-[15px] rounded-2xl",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  href?: string;
  target?: string;
  rel?: string;
};

export function Button({
  variant = "outline",
  size = "md",
  className = "",
  children,
  href,
  target,
  rel,
  ...rest
}: ButtonProps) {
  const classNames = `inline-flex items-center justify-center gap-1.5 border font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} target={target} rel={rel} className={classNames}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classNames} {...rest}>
      {children}
    </button>
  );
}
