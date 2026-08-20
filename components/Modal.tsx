"use client";

import { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, children, maxWidth = "420px" }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[300] bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-parchment border border-border rounded-2xl p-8 w-full relative shadow-2xl animate-fade-up max-h-[90vh] overflow-y-auto"
        style={{ maxWidth }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3.5 text-xl text-ink-muted hover:text-ink leading-none cursor-pointer"
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
