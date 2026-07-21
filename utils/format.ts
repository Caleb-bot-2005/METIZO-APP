export function formatCurrency(amount: number) {
  return `GH₵${amount.toLocaleString('en-GH', { minimumFractionDigits: 0 })}`;
}

export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}
