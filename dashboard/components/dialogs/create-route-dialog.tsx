"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Hosts the existing create page without duplicating its form or save logic. */
export function CreateRouteDialog({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();

  return <Dialog open onOpenChange={open => { if (!open) router.back(); }}>
    <DialogContent className="block overflow-hidden p-0 sm:max-w-6xl">
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Complete the form to create a record. Close this dialog to return to the previous page.</DialogDescription>
      </DialogHeader>
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-4 pr-12 sm:p-6 sm:pr-14">
        {children}
      </div>
    </DialogContent>
  </Dialog>;
}
