// Abort slow cold-compilation requests before Docker's outer timeout so probes
// always terminate rather than leaving child processes behind.
const basePath = (process.env.NEXT_PUBLIC_DASHBOARD_BASE_PATH || "/admin").replace(/\/+$/, "");

try {
  const response = await fetch(`http://127.0.0.1:3000${basePath}`, {
    signal: AbortSignal.timeout(4000),
  });
  await response.body?.cancel();
  process.exit(response.ok ? 0 : 1);
} catch {
  process.exit(1);
}
