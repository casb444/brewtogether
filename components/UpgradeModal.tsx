"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  donationUrl?: string;
}

export function UpgradeModal({ open, onClose, donationUrl }: UpgradeModalProps) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="540px">
      <div className="font-display text-2xl text-ink mb-1.5">Keep the café warm</div>
      <div className="text-sm text-ink-soft mb-6">
        Every room and study group is free during launch. If BrewTogether helps you focus, consider supporting the project with a small donation. Donations never unlock extra access.
      </div>
      {donationUrl ? (
        <Button href={donationUrl} variant="primary" size="lg" className="w-full" target="_blank" rel="noreferrer">
          ☕ Buy us a coffee
        </Button>
      ) : (
        <div className="text-sm text-ink-muted text-center">Donations will open when we publish an external support link.</div>
      )}
    </Modal>
  );
}
