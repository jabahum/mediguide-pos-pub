"use client";

import { createContext, useContext, useMemo, type ComponentProps } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import { dashboardPath, resolveCreateForm } from "@/lib/create-dialog";

export const CreateDialogContext = createContext<{ open: (href: string, replace?: boolean) => void } | null>(null);
export const CreateFormContext = createContext<{ query: string; background: string; parent: string; close: () => void } | null>(null);

/** Create destinations update dialog state; regular destinations retain normal navigation. */
export function useDashboardRouter() {
  const router = useRouter();
  const dialogs = useContext(CreateDialogContext);
  const form = useContext(CreateFormContext);
  return useMemo(() => {
    if (!dialogs) return router;
    const navigate = (href: string, replace: boolean, options?: Parameters<typeof router.push>[1]) => {
      if (resolveCreateForm(href)) { dialogs.open(href, replace); return; }
      if (form) {
        form.close();
        const path = dashboardPath(new URL(href, "https://dashboard.invalid").pathname);
        if (path === dashboardPath(form.background) || path === form.parent) return;
      }
      if (replace) router.replace(href, options);
      else router.push(href, options);
    };
    return { ...router, push: (href: string, options?: Parameters<typeof router.push>[1]) => navigate(href, false, options), replace: (href: string, options?: Parameters<typeof router.replace>[1]) => navigate(href, true, options), back: () => form ? form.close() : router.back() };
  }, [router, dialogs, form]);
}

export function useCreateSearchParams() {
  const native = useSearchParams();
  const form = useContext(CreateFormContext);
  return useMemo(() => new URLSearchParams(form ? form.query : native.toString()), [form, native]);
}

/** Create links become buttons. Back links in forms dismiss the dialog locally. */
export function DashboardLink({ href, children, onClick, ...props }: ComponentProps<typeof NextLink>) {
  const dialogs = useContext(CreateDialogContext);
  const form = useContext(CreateFormContext);
  if (typeof href === "string" && resolveCreateForm(href)) {
    return <button type="button" className={props.className} aria-label={props["aria-label"]} disabled={!dialogs} onClick={() => dialogs?.open(href)}>{children}</button>;
  }
  if (form) return <FormLink {...props} href={href} onClick={onClick}>{children}</FormLink>;
  return <NextLink {...props} href={href} onClick={onClick}>{children}</NextLink>;
}

function FormLink({ href, children, onClick, ...props }: ComponentProps<typeof NextLink>) {
  const router = useDashboardRouter();
  return <NextLink {...props} href={href} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === "_blank") return;
    if (typeof href === "string") { event.preventDefault(); router.push(href); }
  }}>{children}</NextLink>;
}
