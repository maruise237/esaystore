export function closingDifference(expectedCash: number, declaredCash: number) {
  return Math.round((declaredCash - expectedCash) * 100) / 100;
}

export function formatBusinessDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
