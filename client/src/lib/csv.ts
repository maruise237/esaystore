export type CsvCell = string | number | boolean | Date | null | undefined;

function serializeCell(value: CsvCell) {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

export function escapeCsvCell(value: CsvCell) {
  const text = serializeCell(value);
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function createCsv(headers: string[], rows: CsvCell[][]) {
  return `\uFEFF${[headers, ...rows].map((row) => row.map(escapeCsvCell).join(";")).join("\r\n")}\r\n`;
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
