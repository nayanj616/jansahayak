'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog compound components must be used within a <Dialog />');
  }
  return context;
}

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const generatedId = React.useId();
  const titleId = `dialog-title-${generatedId}`;
  const descriptionId = `dialog-desc-${generatedId}`;

  return (
    <DialogContext.Provider
      value={{
        open,
        onOpenChange,
        titleId,
        descriptionId,
      }}
    >
      {children}
    </DialogContext.Provider>
  );
}

export interface DialogContentProps
  extends React.DialogHTMLAttributes<HTMLDialogElement> {
  showCloseButton?: boolean;
}

export const DialogContent = React.forwardRef<
  HTMLDialogElement,
  DialogContentProps
>(({ className, children, showCloseButton = true, ...props }, ref) => {
  const { open, onOpenChange, titleId, descriptionId } = useDialog();
  const innerRef = React.useRef<HTMLDialogElement | null>(null);

  // Synchronize native <dialog> with controlled `open` prop
  React.useEffect(() => {
    const dialog = innerRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch {
          // Fallback if already open or server rendered
        }
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [open]);

  // Merge external and inner refs
  const handleRef = React.useCallback(
    (node: HTMLDialogElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDialogElement | null>).current = node;
      }
    },
    [ref]
  );

  // Native cancel event (Escape key)
  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    e.preventDefault();
    onOpenChange(false);
  };

  // Backdrop click handling
  const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = innerRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <dialog
      ref={handleRef}
      onCancel={handleCancel}
      onClick={handleClick}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={cn(
        'fixed inset-0 m-auto z-50 w-full max-w-lg p-6 rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl',
        'backdrop:bg-slate-900/60 backdrop:backdrop-blur-xs',
        'focus-visible:outline-none max-h-[90vh] overflow-y-auto',
        className
      )}
      {...props}
    >
      <div className="relative">
        {showCloseButton && (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
            className="absolute -top-2 -right-2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {children}
      </div>
    </dialog>
  );
});
DialogContent.displayName = 'DialogContent';

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-left pb-4', className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  id,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialog();
  return (
    <h2
      id={id ?? titleId}
      className={cn('text-lg font-semibold leading-none tracking-tight text-slate-900', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  id,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useDialog();
  return (
    <p
      id={id ?? descriptionId}
      className={cn('text-sm text-slate-500 leading-relaxed', className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-slate-100',
        className
      )}
      {...props}
    />
  );
}

export function DialogClose({
  className,
  children,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = useDialog();

  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) {
          onOpenChange(false);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}

