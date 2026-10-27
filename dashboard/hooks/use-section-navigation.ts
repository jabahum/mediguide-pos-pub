"use client";

import { useContext } from "react";
import { CreateFormContext } from "@/components/dialogs/create-dialog-context";

export function useSectionNavigation(enabled = true) {
  const form = useContext(CreateFormContext);
  return enabled && !form;
}
