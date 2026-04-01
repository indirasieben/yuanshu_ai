import { create } from "zustand";

const DEFAULTS = {
  open: false,
  title: "",
  message: "",
  confirmText: "",
  cancelText: "",
  danger: false,
};

export const useConfirmStore = create((set, get) => ({
  ...DEFAULTS,
  // internal resolver for promise-based API
  _resolve: null,

  confirm: ({
    title,
    message,
    confirmText,
    cancelText,
    danger = false,
  }) => {
    return new Promise((resolve) => {
      set({
        open: true,
        title: String(title || ""),
        message: String(message || ""),
        confirmText: String(confirmText || ""),
        cancelText: String(cancelText || ""),
        danger: !!danger,
        _resolve: resolve,
      });
    });
  },

  close: () => {
    set((s) => {
      if (s._resolve) s._resolve(false);
      return { ...DEFAULTS, _resolve: null };
    });
  },

  accept: () => {
    const { _resolve } = get();
    if (_resolve) _resolve(true);
    set({ ...DEFAULTS, _resolve: null });
  },

  reject: () => {
    const { _resolve } = get();
    if (_resolve) _resolve(false);
    set({ ...DEFAULTS, _resolve: null });
  },
}));

