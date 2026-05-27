// ─── Relative date helpers ─────────────────────────────────────────────
//
// Seed data uses these so the demo always looks fresh ("expires today",
// "uploaded 2 days ago", "follow-up due tomorrow") regardless of when the
// app is opened. Anchored at module-evaluation time, NOT at render time.

/** Reference "now" anchored once at module load. Tests that mock Date
 *  before importing seedData will still get a deterministic anchor. */
const _now = new Date();

/** ISO 'YYYY-MM-DD' date string `n` days before today. */
export function daysAgo(n: number): string {
  const d = new Date(_now);
  d.setDate(_now.getDate() - n);
  return d.toISOString().split('T')[0];
}

/** ISO 'YYYY-MM-DD' date string `n` days after today. Negative values
 *  produce past dates. */
export function daysFromNow(n: number): string {
  const d = new Date(_now);
  d.setDate(_now.getDate() + n);
  return d.toISOString().split('T')[0];
}

/** Full ISO timestamp `n` hours after now. Useful for SLA deadlines. */
export function hoursFromNow(n: number): string {
  const d = new Date(_now);
  d.setTime(_now.getTime() + n * 60 * 60 * 1000);
  return d.toISOString();
}

/** Full ISO timestamp `n` hours before now. */
export function hoursAgo(n: number): string {
  return hoursFromNow(-n);
}

/** Seeds typically want a stable "demo anchor" string for the Settings
 *  page: "Demo data anchored to Tue, May 27 at 14:32". */
export function getDemoAnchor(): { iso: string; pretty: string } {
  const pretty = _now.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return { iso: _now.toISOString(), pretty };
}

// ─── Existing helpers (unchanged) ──────────────────────────────────────

export function isExpired(expiryDate: string): boolean {
  return new Date(expiryDate) < new Date();
}

export function isDueSoon(expiryDate: string, daysThreshold: number = 45): boolean {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const threshold = new Date(today);
  threshold.setDate(today.getDate() + daysThreshold);
  return expiry >= today && expiry <= threshold;
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}
