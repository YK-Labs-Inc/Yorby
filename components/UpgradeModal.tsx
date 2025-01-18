"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AIButton } from "@/components/ai-button";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade your account</DialogTitle>
          <DialogDescription className="pt-4">
            Unlock all practice questions and get access to premium features.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <AIButton pendingText="Upgrading...">Upgrade Now</AIButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
