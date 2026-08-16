import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { dismissToast, subscribeToasts, type ToastItem, type ToastVariant } from '@/lib/toast';
import { cn } from '@/lib/utils';

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-success-foreground/20 bg-success text-success-foreground',
  error: 'border-destructive/30 bg-destructive/5 text-destructive',
  info: 'border-border bg-background text-foreground',
};

const VARIANT_ICONS: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function Toaster(): JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = VARIANT_ICONS[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg',
              VARIANT_STYLES[t.variant],
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p className="flex-1">{t.message}</p>
            <button
              type="button"
              aria-label="Cerrar notificación"
              onClick={() => dismissToast(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
