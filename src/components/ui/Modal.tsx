"use client";

import { useEffect } from "react";

// Brutalist modal (plan §6): flat backdrop (no blur), bordered panel with a
// brand header bar. Controlled via `open`/`onClose`; Esc closes.
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] bg-[var(--surface)] border-[3px] border-ink rounded-[4px] shadow-brutal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-brand border-b-[3px] border-ink px-4 py-2">
          <h2 className="font-comic font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="font-mono font-bold text-ink text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
