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
