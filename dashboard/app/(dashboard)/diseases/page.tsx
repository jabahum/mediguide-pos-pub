"use client";

import * as React from "react";
import { Archive, Pencil, Plus, Save, Stethoscope, SearchX, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CatalogHeader, CatalogLoading, CatalogStatus } from "@/components/clinical-content/catalog";
import { FilterField, ListPagination, StatusFilters } from "@/components/outbreaks/list-page";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { hasBackendPermission } from "@/lib/backend-client";
import { showToast } from "@/lib/toast";
import {
  Disease,
  DiseaseAlias,
  DiseaseCode,
  diseaseService,
} from "@/services/content-hubs.service";

const empty = {
  name: "",
  slug: "",
  short_name: "",
  description: "",
  icon: "",
  color: "",
  status: "active",
  sort_order: 0,
  parent_id: "",
  aliases: [] as DiseaseAlias[],
  codes: [] as DiseaseCode[],
};

export default function DiseasesPage() {
  const canManage = hasBackendPermission("disease.taxonomy.manage");
  const [rows, setRows] = React.useState<Disease[]>([]);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [pages, setPages] = React.useState(0);
  const [parents, setParents] = React.useState<Disease[]>([]);
  const [parentsLoading, setParentsLoading] = React.useState(false);
  const [editing, setEditing] = React.useState<Disease | null>(null);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [form, setForm] = React.useState(empty);
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const requestVersion = React.useRef(0);

  const load = React.useCallback(async () => {
    const request = ++requestVersion.current;
    setLoading(true);
    setError("");
    try {
      const result = await diseaseService.list(search, status, { page, per_page: 20 });
      if (request !== requestVersion.current) return;
      if (page > Math.max(1, result.total_pages)) { setPage(Math.max(1, result.total_pages)); return; }
      setRows(result.items || []);
      setTotal(result.total_items);
      setPages(result.total_pages);
    } catch (error) {
      if (request !== requestVersion.current) return;
      setError(error instanceof Error ? error.message : "Unable to load diseases.");
      showToast.error(
        "Diseases unavailable",
        error instanceof Error ? error.message : "Try again.",
      );
    } finally {
      if (request === requestVersion.current) setLoading(false);
    }
  }, [search, status, page]);
  React.useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => { clearTimeout(timer); requestVersion.current += 1; };
  }, [load]);
  React.useEffect(() => {
    if (!editorOpen) return;
    let cancelled = false;
    setParentsLoading(true);
    void (async () => {
      const first = await diseaseService.list("", "active");
      const options = [...(first.items || [])];
      for (let next = 2; next <= first.total_pages; next++) {
        if (cancelled) return;
        const result = await diseaseService.list("", "active", { page: next });
        options.push(...(result.items || []));
      }
      if (!cancelled) setParents(options);
    })().catch(error => { if (!cancelled) showToast.error("Parent conditions unavailable", actionable(error)); })
      .finally(() => { if (!cancelled) setParentsLoading(false); });
    return () => { cancelled = true; };
  }, [editorOpen]);
  const filtered = Boolean(search.trim() || status);
  function clear() { setLoading(true); setSearch(""); setStatus(""); setPage(1); }
  function closeEditor() { if (busy) return; setEditorOpen(false); setEditing(null); setForm(empty); }

  function edit(value?: Disease) {
    setEditorOpen(true);
    setEditing(value || null);
    setForm(
      value
        ? {
            name: value.name,
            slug: value.slug,
            short_name: value.short_name || "",
            description: value.description || "",
            icon: value.icon || "",
            color: value.color || "",
            status: value.status,
            sort_order: value.sort_order || 0,
            parent_id: value.parent_id || "",
            aliases: value.aliases || [],
            codes: value.codes || [],
          }
        : empty,
    );
  }
  async function save() {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const payload = {
        ...form,
        parent_id: form.parent_id || undefined,
        aliases: form.aliases
          .filter((value) => value.alias.trim())
          .map((value) => ({ alias: value.alias.trim() })),
        codes: form.codes
          .filter((value) => value.code_system.trim() && value.code.trim())
          .map((value) => ({
            code_system: value.code_system.trim(),
            code: value.code.trim(),
            display_name: value.display_name?.trim() || undefined,
          })),
      };
      if (editing) await diseaseService.update(editing.id, payload);
      else await diseaseService.create(payload);
      showToast.success(
        "Disease saved",
        "Names, aliases, codes and hierarchy are now available for classification.",
      );
      setEditorOpen(false);
      setEditing(null);
      setForm(empty);
      await load();
    } catch (error) {
      showToast.error("Disease not saved", actionable(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <CatalogHeader title="Diseases & conditions" description="Manage clinical names, alternative names, standard codes, and relationships used to classify resources." icon={Stethoscope} loading={loading} onRefresh={() => void load()}>
        {canManage && <Button onClick={() => edit()}><Plus className="mr-2 size-4" aria-hidden="true" />New disease</Button>}
      </CatalogHeader>
      <div className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
        <FilterField id="disease-search" label="Search diseases & conditions"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input id="disease-search" className="pl-9" value={search} onChange={event => { setLoading(true); setSearch(event.target.value); setPage(1); }} placeholder="Search name, alias, or slug…" /></div></FilterField>
      </div>
      <StatusFilters value={status} onChange={value => { if (value === status) return; setLoading(true); setStatus(value); setPage(1); }} options={[{ value: "", label: "All conditions" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "archived", label: "Archived" }]} />
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Condition directory</h2><p className="mt-1 text-sm text-muted-foreground" aria-live="polite">{loading ? "Loading conditions…" : error ? "Directory unavailable" : `${total} ${total === 1 ? "condition" : "conditions"}${filtered ? " matching your filters" : " in the directory"}`}</p></div>{filtered && <Button variant="ghost" size="sm" onClick={clear}>Clear filters</Button>}</div>
      {loading ? <CatalogLoading noun="diseases" /> : error ? <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-6"><h2 className="font-semibold">Unable to load conditions</h2><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" onClick={() => void load()}>Try again</Button></div> : rows.length === 0 ? <EmptyState
        className="rounded-xl border border-dashed"
        icon={filtered ? SearchX : Stethoscope}
        title={filtered ? "No matching diseases" : "No diseases yet"}
        description={filtered ? "Try another name, alias, or slug, or clear your filters." : "Add diseases and clinical conditions to classify your resources."}
        action={filtered ? { label: "Clear filters", onClick: clear } : canManage ? { label: "New disease", onClick: () => edit() } : { label: "Refresh", onClick: () => void load() }}
      /> : <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[820px] text-left text-sm">
          <caption className="sr-only">Diseases and conditions with classification, alternative names, standard codes, and status</caption>
          <thead className="border-b bg-muted/30"><tr>{["Condition", "Classification", "Aliases & codes", "Status", ...(canManage ? ["Actions"] : [])].map(label => <th scope="col" className="px-5 py-3 font-medium" key={label}>{label}</th>)}</tr></thead>
          <tbody className="divide-y">{rows.map(row => <tr key={row.id} className="align-top transition-colors hover:bg-muted/20">
            <td className="max-w-md px-5 py-5"><p className="break-words font-semibold">{row.name}{row.short_name && <span className="ml-2 text-xs font-normal text-muted-foreground">{row.short_name}</span>}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{row.description || row.slug}</p></td>
            <td className="max-w-xs px-5 py-5"><p>{row.parent_name || "Top-level condition"}</p><p className="mt-1 break-all text-xs text-muted-foreground">{row.slug}</p></td>
            <td className="max-w-sm px-5 py-5"><p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{row.aliases?.map(value => value.alias).join(" · ") || "No aliases"}</p><div className="mt-2 flex flex-wrap gap-1.5">{row.codes?.length ? <>{row.codes.slice(0, 3).map((value, index) => <Badge variant="secondary" key={index} title={value.display_name}>{value.code_system}: {value.code}</Badge>)}{row.codes.length > 3 && <span className="text-xs text-muted-foreground">+{row.codes.length - 3} more</span>}</> : <span className="text-xs text-muted-foreground">No standard codes</span>}</div></td>
            <td className="px-5 py-5"><CatalogStatus status={row.status} /></td>
            {canManage && <td className="px-5 py-4"><div className="flex justify-end gap-1"><Button size="sm" variant="outline" aria-label={`Edit ${row.name}`} onClick={() => edit(row)}><Pencil className="mr-1 size-3.5" aria-hidden="true" />Edit</Button>{row.status !== "archived" && <Button size="icon" variant="ghost" aria-label={`Archive ${row.name}`} onClick={async () => {
              if (!confirm(`Archive ${row.name}? Existing assignments remain readable.`)) return;
              try { await diseaseService.archive(row.id); await load(); showToast.success("Disease archived"); }
              catch (error) { showToast.error("Archive failed", actionable(error)); }
            }}><Archive className="size-4" aria-hidden="true" /></Button>}</div></td>}
          </tr>)}</tbody>
        </table>
      </div>}
      {!error && <ListPagination page={page} pages={pages} total={total} count={rows.length} loading={loading} onChange={value => { setLoading(true); setPage(value); }} />}
      {canManage && <Dialog open={editorOpen} onOpenChange={open => { if (!open) closeEditor(); }}>
        {editorOpen && <DiseaseEditor form={form} setForm={setForm} rows={parents} parentsLoading={parentsLoading} busy={busy} editing={editing} onSave={save} onClose={closeEditor} />}
      </Dialog>}
    </div>
  );
}

function DiseaseEditor({
  form,
  setForm,
  rows,
  parentsLoading,
  busy,
  editing,
  onSave,
  onClose,
}: {
  form: typeof empty;
  setForm: React.Dispatch<React.SetStateAction<typeof empty>>;
  rows: Disease[];
  parentsLoading: boolean;
  busy: boolean;
  editing: Disease | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const set = (key: keyof typeof empty, value: unknown) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <DialogContent className="sm:max-w-3xl" onInteractOutside={event => { if (busy) event.preventDefault(); }} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} showCloseButton={!busy}>
      <DialogHeader><DialogTitle>{editing ? `Edit ${editing.name}` : "Create disease"}</DialogTitle><DialogDescription>Set the clinical name and classification, then add aliases and standard codes to help people find it.</DialogDescription></DialogHeader>
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Canonical name"
            value={form.name}
            onChange={(value) => set("name", value)}
          />
          <Field
            label="Slug"
            value={form.slug}
            onChange={(value) => set("slug", value)}
          />
          <Field
            label="Short name"
            value={form.short_name}
            onChange={(value) => set("short_name", value)}
          />
          <div>
            <Label htmlFor="disease-parent">Parent condition</Label>
            <select
              id="disease-parent"
              disabled={busy || parentsLoading}
              className="mt-2 h-10 w-full rounded-md border bg-background px-3"
              value={form.parent_id}
              onChange={(event) => set("parent_id", event.target.value)}
            >
              <option value="">{parentsLoading ? "Loading parent conditions…" : "Top level"}</option>
              {form.parent_id && !rows.some(row => row.id === form.parent_id) && <option value={form.parent_id}>{editing?.parent_name || "Current parent"}</option>}
              {rows
                .filter(
                  (value) =>
                    value.id !== editing?.id && value.status === "active",
                )
                .map((value) => (
                  <option key={value.id} value={value.id}>
                    {value.parent_name ? `${value.parent_name} › ` : ""}
                    {value.name}
                  </option>
                ))}
            </select>
          </div>
          <Field
            label="Icon key"
            value={form.icon}
            onChange={(value) => set("icon", value)}
          />
          <Field
            label="Colour or tone"
            value={form.color}
            onChange={(value) => set("color", value)}
          />
          <div className="md:col-span-2">
            <Label htmlFor="disease-description">Description</Label>
            <Textarea
              id="disease-description"
              className="mt-2"
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </div>
        </div>
        <ListEditor
          title="Aliases"
          add={() => set("aliases", [...form.aliases, { alias: "" }])}
        >
          {form.aliases.map((value, index) => (
            <div className="flex gap-2" key={index}>
              <Input
                aria-label={`Alias ${index + 1}`}
                value={value.alias}
                onChange={(event) =>
                  set(
                    "aliases",
                    form.aliases.map((row, position) =>
                      position === index ? { alias: event.target.value } : row,
                    ),
                  )
                }
              />
              <Button
                variant="ghost"
                onClick={() =>
                  set(
                    "aliases",
                    form.aliases.filter((_, position) => position !== index),
                  )
                }
              >
                Remove
              </Button>
            </div>
          ))}
        </ListEditor>
        <ListEditor
          title="Standard codes"
          add={() =>
            set("codes", [
              ...form.codes,
              { code_system: "", code: "", display_name: "" },
            ])
          }
        >
          {form.codes.map((value, index) => (
            <div
              className="grid gap-2 md:grid-cols-[1fr_1fr_2fr_auto]"
              key={index}
            >
              <Input
                aria-label={`Code system ${index + 1}`}
                placeholder="ICD-11"
                value={value.code_system}
                onChange={(event) =>
                  set(
                    "codes",
                    form.codes.map((row, position) =>
                      position === index
                        ? { ...row, code_system: event.target.value }
                        : row,
                    ),
                  )
                }
              />
              <Input
                aria-label={`Standard code ${index + 1}`}
                placeholder="Code"
                value={value.code}
                onChange={(event) =>
                  set(
                    "codes",
                    form.codes.map((row, position) =>
                      position === index
                        ? { ...row, code: event.target.value }
                        : row,
                    ),
                  )
                }
              />
              <Input
                aria-label={`Code display name ${index + 1}`}
                placeholder="Display name"
                value={value.display_name || ""}
                onChange={(event) =>
                  set(
                    "codes",
                    form.codes.map((row, position) =>
                      position === index
                        ? { ...row, display_name: event.target.value }
                        : row,
                    ),
                  )
                }
              />
              <Button
                variant="ghost"
                onClick={() =>
                  set(
                    "codes",
                    form.codes.filter((_, position) => position !== index),
                  )
                }
              >
                Remove
              </Button>
            </div>
          ))}
        </ListEditor>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button disabled={busy || !form.name.trim()} onClick={onSave}>
            <Save className="mr-2 h-4 w-4" />
            {busy ? "Saving…" : "Save disease"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={`disease-${label.replaceAll(" ", "-").toLowerCase()}`}>{label}</Label>
      <Input
        id={`disease-${label.replaceAll(" ", "-").toLowerCase()}`}
        className="mt-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
function ListEditor({
  title,
  add,
  children,
}: {
  title: string;
  add: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{title}</Label>
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="mr-2 h-3 w-3" />
          Add
        </Button>
      </div>
      {children}
    </div>
  );
}
function actionable(value: unknown) {
  const message = value instanceof Error ? value.message : "Try again.";
  return /cycle/i.test(message)
    ? "Choose a parent outside this disease's descendants."
    : /already|conflict|duplicate/i.test(message)
      ? "That name, alias, slug or code is already assigned. Choose a unique value."
      : message;
}
