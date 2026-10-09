import { create } from 'zustand';
import type { Toast, ModalState } from '../types/ui';

interface UIState {
  toasts: Toast[];
  modal: ModalState;
  sidebarOpen: boolean;
  // Actions
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  openModal: (modal: Omit<ModalState, 'isOpen'>) => void;
  closeModal: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  modal: { isOpen: false },
  sidebarOpen: false,

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    const newToast = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    if (toast.duration !== 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, toast.duration ?? 5000);
    }
    return id;
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  openModal: (modal) => {
    set({ modal: { ...modal, isOpen: true } });
  },

  closeModal: () => {
    set({ modal: { isOpen: false } });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },
}));
