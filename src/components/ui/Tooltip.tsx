import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Tooltip({
  label,
  children,
  side = 'top',
  className,
}: {
  label: string;
  children?: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}) {
  return (
    <span className={cn('group relative inline-flex items-center', className)}>
      {children ?? <Info className="h-3.5 w-3.5 text-slate-500" aria-hidden />}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-[60] w-max max-w-[260px] -translate-x-1/2 rounded-lg border border-white/10 bg-slate-900/95 px-2.5 py-1.5 text-[11px] font-medium leading-snug text-slate-200 opacity-0 shadow-xl ring-1 ring-black/40 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
        )}
      >
        {label}
      </span>
    </span>
  );
}
