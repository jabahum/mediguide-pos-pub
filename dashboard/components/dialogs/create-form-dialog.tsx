"use client";

import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Hosts the existing create page without duplicating its form or save logic. */
export function CreateFormDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="block overflow-hidden p-0 sm:max-w-6xl">
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Complete the form to create a record. Close this dialog to return to the page underneath.</DialogDescription>
      </DialogHeader>
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-4 pr-12 sm:p-6 sm:pr-14">
        {children}
      </div>
    </DialogContent>
  </Dialog>;
}
