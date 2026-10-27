import { beforeEach, expect, test, vi } from "vitest";
const service = vi.hoisted(() => ({ list: vi.fn(), listResources: vi.fn() }));
vi.mock("@/services/outbreaks.service", () => ({ outbreaksService: service }));
import { loadResourceGroups } from "./resource-data";
beforeEach(() => vi.resetAllMocks());
test("loads subsequent outbreak and resource pages", async () => {
  service.list.mockImplementation(({ page }) => Promise.resolve({ items: [{ id: `o${page}`, title: `Outbreak ${page}` }], total_pages: 2 }));
  service.listResources.mockImplementation((id, page) => Promise.resolve({ items: [{ id: `${id}-r${page}` }], total_pages: id === "o1" ? 2 : 1 }));
  const groups = await loadResourceGroups();
  expect(groups.map((group) => group.outbreak.id)).toEqual(["o1", "o2"]);
  expect(groups[0].resources.map((resource) => resource.id)).toEqual(["o1-r1", "o1-r2"]);
  expect(service.listResources).toHaveBeenCalledWith("o1", 2);
});
test("does not present a failed catalog request as a complete list", async () => {
  service.list.mockResolvedValue({ items: [{ id: "o1" }], total_pages: 1 });
  service.listResources.mockRejectedValue(new Error("Resource request failed"));
  await expect(loadResourceGroups()).rejects.toThrow("Resource request failed");
});
