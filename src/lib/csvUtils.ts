export function generateCSV(columns: string[], data: Record<string, string>[]): string {
  const header = columns.join(',');
  const rows = data.map(row => 
    columns.map(col => {
      const val = row[col] || '';
      // Escape quotes and wrap in quotes if needed
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );
  return [header, ...rows].join('\n');
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToCSV(
  columns: string[],
  data: Record<string, string>[],
  filename: string = 'export.csv'
): void {
  const csv = generateCSV(columns, data);
  downloadCSV(csv, filename);
}
