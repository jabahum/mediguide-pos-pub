import {
  type PublicPillar,
  type PublicResource,
} from "../../api/public-guidelines";

export function flattenPillars(pillars: PublicPillar[]): PublicPillar[] {
  return pillars.flatMap((pillar) => [
    pillar,
    ...flattenPillars(pillar.children),
  ]);
}

export function countItems(pillar: PublicPillar): number {
  return (
    pillar.items.length +
    pillar.children.reduce((total, child) => total + countItems(child), 0)
  );
}

export function collectResources(pillar: PublicPillar): PublicResource[] {
  return [
    ...pillar.items.flatMap((item) => (item.resource ? [item.resource] : [])),
    ...pillar.children.flatMap(collectResources),
  ];
}

export function uniqueResources(
  resources: PublicResource[],
): PublicResource[] {
  const seen = new Set<string>();
  return resources.filter((resource) => {
    const key = `${resource.content_type}:${resource.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function dateLabel(value?: string) {
  if (!value) return "date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en-UG", { dateStyle: "medium" }).format(date);
}
