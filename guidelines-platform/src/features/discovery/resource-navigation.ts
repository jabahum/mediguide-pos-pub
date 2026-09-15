export function isExternalResourceRoute(route?: string): boolean {
  if (!route) return false;
  try {
    const url = new URL(route);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function confirmExternalResource(
  confirm: (message: string) => boolean = window.confirm,
): boolean {
  return confirm(
    "You are leaving MediGuide to open an approved external source. Continue?",
  );
}
