export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: number;
  text: string;
  type: ToastType;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
  id: number;
  resolve: (value: boolean) => void;
}

let toasts: ToastItem[] = [];
let confirmRequest: ConfirmRequest | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeNotify(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToastsSnapshot(): ToastItem[] {
  return toasts;
}

export function getConfirmSnapshot(): ConfirmRequest | null {
  return confirmRequest;
}

export function dismissToast(id: number) {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

export function toast(
  text: string,
  type: ToastType = "info",
  durationMs = 4200
) {
  const id = Date.now() + Math.floor(Math.random() * 1000);
  toasts = [...toasts, { id, text, type }];
  emit();

  window.setTimeout(() => {
    dismissToast(id);
  }, durationMs);
}

toast.success = (text: string, durationMs?: number) =>
  toast(text, "success", durationMs);
toast.error = (text: string, durationMs?: number) =>
  toast(text, "error", durationMs);
toast.info = (text: string, durationMs?: number) =>
  toast(text, "info", durationMs);
toast.warning = (text: string, durationMs?: number) =>
  toast(text, "warning", durationMs);

export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    confirmRequest = {
      id: Date.now(),
      title: options.title ?? "Confirmar ação",
      message: options.message,
      confirmLabel: options.confirmLabel ?? "Confirmar",
      cancelLabel: options.cancelLabel ?? "Cancelar",
      destructive: options.destructive ?? false,
      resolve,
    };
    emit();
  });
}

export function resolveConfirm(value: boolean) {
  if (!confirmRequest) return;
  confirmRequest.resolve(value);
  confirmRequest = null;
  emit();
}
