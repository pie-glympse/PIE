"use client";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  error?: string | null;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "Confirmer",
  cancelButtonText = "Annuler",
  error,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4">
        <h3 className="text-h3 font-urbanist mb-4 text-[var(--color-text)]">
          {title}
        </h3>
        <p className="text-body-large font-poppins text-[var(--color-grey-four)] mb-4">
          {message}
        </p>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[var(--color-grey-three)] hover:text-[var(--color-text)] transition-colors font-poppins text-body-large"
          >
            {cancelButtonText}
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-poppins text-body-large"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}

