import type { HeaderRow } from "../types/config.js";

export function createID() {
  return Math.random().toString(36).slice(2);
}

export function headersFromRows(rows: HeaderRow[]) {
  return rows.reduce<Record<string, string>>((headers, row) => {
    if (row.key.trim()) {
      headers[row.key.trim()] = row.value;
    }
    return headers;
  }, {});
}

export function rowsFromHeaders(headers: Record<string, string>) {
  const rows = Object.entries(headers).map(([key, value]) => ({ id: createID(), key, value }));
  return rows.length > 0 ? rows : [{ id: createID(), key: "", value: "" }];
}

export function formatHeaders(headers?: Record<string, string>) {
  if (!headers || Object.keys(headers).length === 0) {
    return "{}";
  }
  return JSON.stringify(headers, null, 2);
}
