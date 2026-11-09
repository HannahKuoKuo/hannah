"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Toast = { id: number; message: string; variant: "success" | "error" };
const EVENT = "acesign:toast";

export function toast(message: string, variant: Toast["variant"] = "success") {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, variant } }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    let id = 0;
    const onToast = (e: Event) => {
      const { message, variant } = (e as CustomEvent<Omit<Toast, "id">>).detail;
      const t = { id: ++id, message, variant };
      setToasts((list) => [...list.slice(-3), t]);
      setTimeout(() => setToasts((list) => list.filter((x) => x.id !== t.id)), 5000);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.variant === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex items-start gap-2.5 rounded-lg border bg-card p-3 text-sm shadow-lg",
            t.variant === "error" ? "border-red-200" : "border-emerald-200",
          )}
        >
          {t.variant === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />}
          <p className="flex-1">{t.message}</p>
          <button onClick={() => setToasts((l) => l.filter((x) => x.id !== t.id))} aria-label="Dismiss" className="text-muted-foreground cursor-pointer">
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
