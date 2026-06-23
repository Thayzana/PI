import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from "lucide-react";
import {
  dismissToast,
  getConfirmSnapshot,
  getToastsSnapshot,
  resolveConfirm,
  subscribeNotify,
  type ToastItem,
  type ToastType,
} from "../lib/notify";

function toastIcon(type: ToastType) {
  switch (type) {
    case "success":
      return <CheckCircle2 size={16} className="shrink-0" />;
    case "error":
      return <AlertCircle size={16} className="shrink-0" />;
    case "warning":
      return <AlertTriangle size={16} className="shrink-0" />;
    default:
      return <Info size={16} className="shrink-0" />;
  }
}

function toastStyles(type: ToastType) {
  switch (type) {
    case "success":
      return "bg-emerald-50 text-emerald-900 border-emerald-200";
    case "error":
      return "bg-red-50 text-red-900 border-red-200";
    case "warning":
      return "bg-amber-50 text-amber-900 border-amber-200";
    default:
      return "bg-white text-[#2e2624] border-[#eee7de]";
  }
}

function ToastCard({ item }: { item: ToastItem }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl shadow-lg border text-xs font-semibold max-w-sm ${toastStyles(item.type)}`}
      role="status"
      aria-live="polite"
    >
      {toastIcon(item.type)}
      <span className="flex-1 leading-relaxed">{item.text}</span>
      <button
        type="button"
        onClick={() => dismissToast(item.id)}
        className="p-0.5 rounded-md opacity-60 hover:opacity-100 cursor-pointer shrink-0"
        aria-label="Fechar aviso"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export default function NotifyHost() {
  const toasts = useSyncExternalStore(
    subscribeNotify,
    getToastsSnapshot,
    getToastsSnapshot
  );
  const confirmDialog = useSyncExternalStore(
    subscribeNotify,
    getConfirmSnapshot,
    getConfirmSnapshot
  );

  return (
    <>
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => (
            <ToastCard key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
            onClick={() => resolveConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="bg-white border border-[#eee7de] rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
            >
              <div className="space-y-1.5">
                <h3
                  id="confirm-dialog-title"
                  className="text-sm font-black text-[#2e2624]"
                >
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-[#7d6f6b] leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => resolveConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-[#eee7de] text-xs font-bold text-[#7d6f6b] hover:bg-[#faf7f2] cursor-pointer"
                >
                  {confirmDialog.cancelLabel}
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => resolveConfirm(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer ${
                    confirmDialog.destructive
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-brand hover:bg-brand-hover"
                  }`}
                >
                  {confirmDialog.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
