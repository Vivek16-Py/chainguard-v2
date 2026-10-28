import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'amber';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  primary:
    'bg-emerald-500 text-emerald-950 shadow-[0_10px_30px_-12px_rgba(16,185,129,0.65)] hover:bg-emerald-400 focus-visible:outline-emerald-400',
  secondary:
    'bg-white/[0.06] text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-white/[0.1] focus-visible:outline-slate-400',
  ghost: 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 focus-visible:outline-slate-400',
  danger:
    'bg-rose-500 text-white shadow-[0_10px_30px_-12px_rgba(244,63,94,0.7)] hover:bg-rose-400 focus-visible:outline-rose-400',
  outline:
    'border border-slate-700 bg-transparent text-slate-200 hover:border-emerald-500/40 hover:bg-emerald-500/[0.06] hover:text-emerald-200 focus-visible:outline-emerald-400',
  amber:
    'bg-amber-400/15 text-amber-200 ring-1 ring-inset ring-amber-400/30 hover:bg-amber-400/20 focus-visible:outline-amber-300',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-sm gap-2.5',
  icon: 'h-9 w-9 justify-center',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-xl font-semibold tracking-tight transition-all duration-150',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:pointer-events-none disabled:opacity-40',
        'active:translate-y-[0.5px]',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = 'Button';
