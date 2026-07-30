/** Resets the test database's mutable data (leads, sessions) back to the seeded baseline — see src/app/api/test/reset/route.ts. */
export async function resetTestData(): Promise<void> {
  const res = await fetch("http://localhost:3001/api/test/reset", { method: "POST" });
  if (!res.ok) {
    throw new Error(`Test data reset failed: HTTP ${res.status} — is ALLOW_TEST_RESET set?`);
  }
}
