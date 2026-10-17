import React from "react";
import { Dialog } from "@mui/material";
import { AlertTriangle, X, Loader2 } from "lucide-react";

interface DeleteModalProps {
  open: boolean;
  title: string;
  /** Body text explaining what's about to happen. */
  message: string;
  /** Label for the confirm button. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Label for the cancel button. Defaults to "Cancel". */
  cancelLabel?: string;
  /** "danger" = red confirm (deletes); "primary" = sage green (safe actions). */
  variant?: "danger" | "primary";
  /** Shows a spinner + disables buttons while an async confirm is in flight. */
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onClose,
}) => {
  const isDanger = variant === "danger";

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          className: "rounded-3xl overflow-hidden",
          style: {
            background: "linear-gradient(180deg, #f3f7ef 0%, #ffffff 45%)",
          },
        },
      }}
    >
      <div className="relative px-7 pb-6 pt-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg ${
              isDanger
                ? "bg-gradient-to-br from-red-400 to-red-600 shadow-red-500/30"
                : "bg-gradient-to-br from-primary-400 to-primary-600 shadow-primary-500/30"
            }`}
          >
            <AlertTriangle size={22} />
          </span>
          <div className="flex-1">
            <h2 className="m-0 text-lg font-bold text-stone-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute right-5 top-6 flex cursor-pointer items-center border-0 bg-transparent text-stone-400 hover:text-stone-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="my-5 h-px bg-primary-100" />

        {/* Message */}
        <p className="m-0 text-sm leading-relaxed text-stone-600 whitespace-pre-line">
          {message}
        </p>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer rounded-full border border-stone-200 bg-white px-6 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 rounded-full border-0 px-7 py-2.5 text-sm font-bold text-white shadow-lg transition-opacity ${
              isDanger
                ? "bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/30"
                : "bg-gradient-to-r from-primary-500 to-primary-600 shadow-primary-500/30"
            } ${loading ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:opacity-90"}`}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default DeleteModal;
