import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  className,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy: string;
  className?: string;
  dismissible?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, dismissible]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && dismissible) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn('relative w-full max-w-lg animate-slide-up', className)}
      >
        {dismissible ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute -right-2 -top-2 z-10 rounded-full bg-slate-900 ring-1 ring-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
        {children}
      </div>
    </div>
  );
}
