import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'brand' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children?: React.ReactNode;
  footer?: React.ReactNode;
  closeDisabled?: boolean;
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

const iconTones = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-100',
  danger: 'bg-rose-50 text-rose-600 ring-rose-100',
  success: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
};

/**
 * Accessible dialog: traps initial focus, closes on Escape and backdrop click,
 * restores focus to the trigger on close and locks page scroll while open.
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  icon,
  tone = 'brand',
  size = 'md',
  children,
  footer,
  closeDisabled = false,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closeDisabledRef = useRef(closeDisabled);
  closeDisabledRef.current = closeDisabled;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTarget = panelRef.current?.querySelector<HTMLElement>(
      'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [data-autofocus]'
    );
    (focusTarget ?? panelRef.current)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !closeDisabledRef.current) {
        event.stopPropagation();
        onCloseRef.current();
      }
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] animate-fade-in"
        onClick={() => !closeDisabled && onClose()}
        aria-hidden="true"
      />
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          className={clsx(
            'relative w-full rounded-t-3xl border border-slate-200 bg-white shadow-2xl outline-none animate-scale-in sm:rounded-2xl',
            sizes[size]
          )}
        >
          <div className="flex items-start gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
            {icon && (
              <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1', iconTones[tone])}>{icon}</div>
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 id={titleId} className="text-lg font-semibold text-slate-900">
                {title}
              </h2>
              {description && (
                <div id={descriptionId} className="mt-1 text-sm leading-relaxed text-slate-500">
                  {description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={closeDisabled}
              className="-mr-1.5 -mt-1 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children && <div className="max-h-[70vh] overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>}
          {footer && (
            <div className="flex flex-col-reverse gap-2.5 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
