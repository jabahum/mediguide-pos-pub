"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { resolveCreateForm, type CreateFormRequest } from "@/lib/create-dialog";
import { CreateDialogContext, CreateFormContext } from "./create-dialog-context";
import { CreateFormDialog } from "./create-form-dialog";

const loading = () => <p role="status" className="py-12 text-center text-muted-foreground">Loading form…</p>;
const forms = {
  "content-hubs": dynamic(() => import("@/app/(dashboard)/content-hubs/new/create-form"), { loading }),
  "decision-tools": dynamic(() => import("@/app/(dashboard)/decision-tools/create/create-form"), { loading }),
  drugs: dynamic(() => import("@/app/(dashboard)/drugs/create/create-form"), { loading }),
  "emergency-protocols": dynamic(() => import("@/app/(dashboard)/emergency-protocols/create/create-form"), { loading }),
  guidelines: dynamic(() => import("@/app/(dashboard)/guidelines/create/create-form"), { loading }),
  "health-facilities": dynamic(() => import("@/app/(dashboard)/health-facilities/create/create-form"), { loading }),
  outbreaks: dynamic(() => import("@/app/(dashboard)/outbreaks/new/create-form"), { loading }),
  pages: dynamic(() => import("@/app/(dashboard)/pages/create/create-form"), { loading }),
  "situation-reports": dynamic(() => import("@/app/(dashboard)/situation-reports/new/create-form"), { loading }),
  documentation: dynamic(() => import("@/app/(dashboard)/support/documentation/create/create-form"), { loading }),
  faqs: dynamic(() => import("@/app/(dashboard)/support/faqs/create/create-form"), { loading }),
  "faq-tags": dynamic(() => import("@/app/(dashboard)/support/faqs/tags/create/create-form"), { loading }),
  users: dynamic(() => import("@/app/(dashboard)/users/create/create-form"), { loading }),
};
const PageContentForm = dynamic(() => import("@/app/(dashboard)/generic-pages/[pageKey]/content/create/create-form"), { loading });

type ActiveForm = CreateFormRequest & { instance: number; background: string };

export function CreateDialogProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const client = useQueryClient();
  const [active, setActive] = useState<ActiveForm | null>(null);
  const sequence = useRef(0);
  const open = useCallback((href: string, replace = false) => {
    const request = resolveCreateForm(href);
    if (!request) return;
    const instance = ++sequence.current;
    setActive(current => ({ ...request, background: current?.background || pathname, instance: replace && current?.path === request.path ? current.instance : instance }));
  }, [pathname]);
  const close = useCallback(() => setActive(null), []);
  const finish = useCallback(() => { setActive(null); void client.invalidateQueries(); }, [client]);
  // Discard a form if an unrelated navigation changes the background page.
  if (active && active.background !== pathname) setActive(null);
  const dialogs = useMemo(() => ({ open }), [open]);
  const form = useMemo(() => active ? ({ query: active.query, parent: active.parent, background: active.background, close: finish }) : null, [active, finish]);
  const Form = active && active.id !== "page-content" ? forms[active.id] : null;

  return <CreateDialogContext.Provider value={dialogs}>
    {children}
    {active && <CreateFormContext.Provider value={form}>
      <CreateFormDialog title={active.title} onClose={close}>
        {active.id === "page-content" ? <PageContentForm key={active.instance} pageKey={active.pageKey} /> : Form && <Form key={active.instance} />}
      </CreateFormDialog>
    </CreateFormContext.Provider>}
  </CreateDialogContext.Provider>;
}
