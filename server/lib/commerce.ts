export type PaymentBreakdown = { cash?: number; mobileMoney?: number };

export function sumPaid(breakdown: PaymentBreakdown) {
  return Number((Math.max(0, breakdown.cash ?? 0) + Math.max(0, breakdown.mobileMoney ?? 0)).toFixed(2));
}

export function paymentMethodFor(total: number, paid: number, breakdown: PaymentBreakdown) {
  if (paid <= 0) return "credit" as const;
  if (paid < total) return "mixed" as const;
  if ((breakdown.cash ?? 0) > 0 && (breakdown.mobileMoney ?? 0) > 0) return "mixed" as const;
  return (breakdown.mobileMoney ?? 0) > 0 ? "mobile_money" as const : "cash" as const;
}

export function money(value: number) {
  return Number(value.toFixed(2));
}
