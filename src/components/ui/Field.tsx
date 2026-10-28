import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const fieldClass =
  'w-full rounded-xl border border-slate-700/70 bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-100 shadow-inner shadow-black/20 outline-none transition ' +
  'placeholder:text-slate-600 hover:border-slate-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className,
  trailing,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          {label}
          {required ? <span className="ml-1 text-emerald-400">*</span> : null}
        </label>
        {trailing}
      </div>
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-[11px] leading-relaxed text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldClass, 'appearance-none bg-[right_0.9rem_center] pr-9', className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, 'min-h-[92px] resize-y leading-relaxed', className)} {...props} />;
}

export function QtyInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      inputMode="numeric"
      className={cn(fieldClass, 'font-mono tabular-nums', className)}
      {...props}
    />
  );
}
