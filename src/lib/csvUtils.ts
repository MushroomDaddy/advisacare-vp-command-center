// ==============================
// CSV Utilities — Single Source
// ==============================

export function generateCSV(
  columns: string[],
  data: Record<string, string>[]
): string {
  const header = columns.join(',');
  const rows = data.map(row =>
    columns.map(col => {
      const val = row[col] ?? '';
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(',')
  );
  return [header, ...rows].join('\n');
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export an array of objects to CSV. Columns auto-detected from keys of first row.
 * Overloads:
 *   exportToCSV(data: Record<string, string>[], filename?: string)
 *   exportToCSV(columns: string[], data: Record<string, string>[], filename?: string)
 */
export function exportToCSV(
  first: string[] | Record<string, string>[],
  second?: Record<string, string>[] | string,
  third?: string
): void {
  let columns: string[];
  let data: Record<string, string>[];
  let filename: string;

  if (first.length > 0 && typeof first[0] === 'string') {
    // Legacy: exportToCSV(columns, data, filename)
    columns = first as string[];
    data = second as Record<string, string>[];
    filename = (third as string) || 'export.csv';
  } else {
    // New: exportToCSV(data, filename)
    data = first as Record<string, string>[];
    columns = data.length > 0 ? Object.keys(data[0]) : [];
    filename = (typeof second === 'string' ? second : undefined) || 'export.csv';
  }

  const csv = generateCSV(columns, data);
  downloadCSV(csv, filename);
}
