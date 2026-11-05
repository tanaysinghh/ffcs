import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto max-h-[90dvh] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-lift open:animate-modal-in"
    >
      {open ? (
        <div className="p-5 sm:p-6">
          <h2 id={titleId} className="mb-4 font-display text-lg font-semibold">
            {title}
          </h2>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

interface ConfirmDialogProps {
  request: ConfirmRequest | null;
  onClose: () => void;
}

export function ConfirmDialog({ request, onClose }: ConfirmDialogProps) {
  return (
    <Modal open={request !== null} title={request?.title ?? ''} onClose={onClose}>
      <p className="text-sm leading-relaxed text-ink-soft">{request?.message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="danger"
          onClick={() => {
            request?.onConfirm();
            onClose();
          }}
        >
          {request?.confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
