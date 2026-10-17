export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node-only import so the Edge instrumentation bundle never pulls in better-sqlite3
    const { runMigrations } = await import("@/db/auto-migrate");
    await runMigrations();

    const { scheduleUnusedImageCleanup } = await import(
      "@/lib/file-storage/unused-images"
    );
    scheduleUnusedImageCleanup();
  }
}
