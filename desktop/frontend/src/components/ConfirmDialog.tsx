import { useEffect } from "react";

export function ConfirmDialog(props: {
  cancelLabel: string;
  confirmLabel: string;
  isOpen: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  targetName: string;
  title: string;
}) {
  useEffect(() => {
    if (!props.isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        props.onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [props.isOpen, props.onCancel]);

  if (!props.isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={props.onCancel}>
      <section
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="confirm-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="confirm-dialog-head">
          <span className="confirm-dialog-icon" aria-hidden="true" />
          <div>
            <h2 id="confirm-dialog-title">{props.title}</h2>
            <p>{props.message}</p>
          </div>
        </div>
        <div className="confirm-dialog-target">{props.targetName}</div>
        <div className="confirm-dialog-actions">
          <button type="button" onClick={props.onCancel}>{props.cancelLabel}</button>
          <button type="button" className="danger" onClick={props.onConfirm}>{props.confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
