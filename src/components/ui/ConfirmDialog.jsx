import { createPortal } from "react-dom";
import { CheckCircle2, Info, Loader2, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

const variantStyles = {
    default: {
        iconWrap: "bg-green-100 text-green-700",
        confirm: "default",
    },
    warning: {
        iconWrap: "bg-amber-100 text-amber-700",
        confirm: "default",
    },
    success: {
        iconWrap: "bg-green-100 text-green-700",
        confirm: "default",
    },
};

export function ConfirmDialog({
    open,
    onClose,
    title,
    description,
    children,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    loading = false,
    hideCancel = false,
    variant = "default",
    icon: Icon = Info,
}) {
    if (!open || typeof document === "undefined") return null;

    const styles = variantStyles[variant] || variantStyles.default;

    return createPortal(
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-200"
            role="presentation"
            onClick={() => {
                if (!loading) onClose?.();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    disabled={loading}
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
                    aria-label="Close"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="p-6 pt-7">
                    <div className="flex gap-4">
                        <div
                            className={cn(
                                "shrink-0 w-11 h-11 rounded-xl flex items-center justify-center",
                                styles.iconWrap
                            )}
                        >
                            {variant === "success" ? (
                                <CheckCircle2 className="h-6 w-6" />
                            ) : (
                                <Icon className="h-6 w-6" />
                            )}
                        </div>
                        <div className="min-w-0 pr-6">
                            <h2
                                id="confirm-dialog-title"
                                className="text-lg font-semibold text-slate-900 m-0 leading-snug"
                            >
                                {title}
                            </h2>
                            {description ? (
                                <p className="mt-2 text-sm text-slate-600 leading-relaxed m-0">{description}</p>
                            ) : null}
                            {children}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-4 bg-slate-50/90 border-t border-slate-100">
                    {!hideCancel ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="sm:min-w-[100px] border-slate-300 text-slate-700"
                            disabled={loading}
                            onClick={onClose}
                        >
                            {cancelText}
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        variant={styles.confirm}
                        className={cn(
                            "sm:min-w-[100px] text-white",
                            variant === "success" ? "bg-green-700 hover:bg-green-800" : "bg-green-700 hover:bg-green-800"
                        )}
                        disabled={loading}
                        onClick={() => {
                            if (onConfirm) onConfirm();
                            else onClose?.();
                        }}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Please wait…
                            </>
                        ) : (
                            confirmText
                        )}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
