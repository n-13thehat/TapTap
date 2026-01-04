export type CsvRow = Record<string, string | number | null | undefined>;

export function toCsv(rows: CsvRow[], headers?: string[]): string {
  if (!rows.length) return (headers || []).join(",") + "\n";
  const cols = headers || Object.keys(rows[0]);
  const lines = [cols.join(",")];
  for (const r of rows) {
    lines.push(
      cols
        .map((k) => formatCsvField(r[k]))
        .join(",")
    );
  }
  return lines.join("\n") + "\n";
}

function formatCsvField(v: any) {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

