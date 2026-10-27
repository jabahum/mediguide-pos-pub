import {
  outbreaksService,
  type OutbreakRecord,
  type OutbreakResourceRecord,
  type PagedResult,
} from "@/services/outbreaks.service";

export type ResourceGroup = {
  outbreak: OutbreakRecord & { id: string };
  resources: OutbreakResourceRecord[];
};

async function allPages<T>(fetchPage: (page: number) => Promise<PagedResult<T>>) {
  const first = await fetchPage(1);
  const items = [...(first.items || [])];
  for (let page = 2; page <= first.total_pages; page += 1) {
    const next = await fetchPage(page);
    items.push(...(next.items || []));
  }
  return items;
}

export async function loadResourceGroups(): Promise<ResourceGroup[]> {
  const outbreaks = await allPages((page) =>
    outbreaksService.list({ page, per_page: 100 }),
  );
  const groups: ResourceGroup[] = [];
  // Bound requests when a large outbreak catalog is loaded.
  for (let start = 0; start < outbreaks.length; start += 6) {
    const batch = await Promise.all(
      outbreaks.slice(start, start + 6).filter(
        (outbreak): outbreak is OutbreakRecord & { id: string } => Boolean(outbreak.id),
      ).map(async (outbreak) => ({
        outbreak,
        resources: await allPages((page) => outbreaksService.listResources(outbreak.id, page)),
      })),
    );
    groups.push(...batch);
  }
  return groups;
}
