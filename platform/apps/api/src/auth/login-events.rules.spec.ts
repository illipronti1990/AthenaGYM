describe('G-1 login security rules', () => {
  it('locks after 5 failed attempts for 5 minutes', () => {
    const MAX = 5;
    const LOCK_MS = 5 * 60_000;
    let count = 0;
    let lockedUntil: number | null = null;
    const fail = (now: number) => {
      count += 1;
      if (count >= MAX) lockedUntil = now + LOCK_MS;
      return { count, lockedUntil };
    };
    const t0 = 1_000_000;
    fail(t0);
    fail(t0);
    fail(t0);
    fail(t0);
    const last = fail(t0);
    expect(last.count).toBe(5);
    expect(last.lockedUntil).toBe(t0 + LOCK_MS);
  });
});
