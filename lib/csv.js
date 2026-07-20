// Generic CSV helpers shared by every admin export (Customers, Reports, ...).

export function csvEscape(value) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function rowsToCsv(header, rows) {
  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}
