import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
  compactLabel?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'border border-line bg-surface text-ink hover:bg-sunken',
  ghost: 'text-ink-soft hover:bg-sunken hover:text-ink',
  danger: 'border border-line bg-surface text-danger hover:bg-danger-soft',
};

export function Button({
  variant = 'secondary',
  icon,
  compactLabel = false,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 lg:h-9 lg:min-w-9 ${
        compactLabel ? 'px-0 sm:px-3' : 'px-3'
      } ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children ? <span className={compactLabel ? 'sr-only sm:not-sr-only' : ''}>{children}</span> : null}
    </button>
  );
}
