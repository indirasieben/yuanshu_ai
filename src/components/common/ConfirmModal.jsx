import { X } from "lucide-react";
import { useConfirmStore } from "../../stores/confirmStore";

export default function ConfirmModal() {
  const {
    open,
    title,
    message,
    confirmText,
    cancelText,
    danger,
    accept,
    reject,
    close,
  } = useConfirmStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={close}
      />

      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-sm font-medium text-ink">{title}</h2>
          <button
            type="button"
            onClick={close}
            className="p-1.5 hover:bg-cream-dark rounded-lg text-ink-muted hover:text-ink bg-transparent border-none cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs text-ink-muted leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4">
          <button
            type="button"
            onClick={reject}
            className="px-4 py-2 rounded-xl text-xs text-ink-muted hover:text-ink hover:bg-cream-dark bg-transparent border border-border cursor-pointer transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={accept}
            className={`px-4 py-2 rounded-xl text-xs font-medium border-none cursor-pointer transition-colors ${
              danger
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-ink text-cream-light hover:bg-ink-light"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
