export function amountStillDue(total: number, cash: number, mobileMoney: number) {
  return Math.max(0, total - Math.max(0, cash) - Math.max(0, mobileMoney));
}

export function suggestedCashAmounts(total: number) {
  const normalized = Math.max(total, 0);
  const roundedDown = Math.floor(normalized / 500) * 500;
  return Array.from(new Set([Math.max(500, roundedDown - 500), roundedDown, normalized])).filter((amount) => amount > 0 && amount <= normalized).sort((a, b) => a - b);
}

export function requiresCustomerForSale(total: number, cash: number, mobileMoney: number) {
  return amountStillDue(total, cash, mobileMoney) > 0;
}

export function excessPayment(total: number, cash: number, mobileMoney: number) {
  return Math.max(0, Math.max(0, cash) + Math.max(0, mobileMoney) - Math.max(0, total));
}

export function canConfirmSale({ itemCount, total, cash, mobileMoney, customerId }: { itemCount: number; total: number; cash: number; mobileMoney: number; customerId?: string }) {
  if (itemCount <= 0 || excessPayment(total, cash, mobileMoney) > 0) return false;
  return !requiresCustomerForSale(total, cash, mobileMoney) || Boolean(customerId);
}
