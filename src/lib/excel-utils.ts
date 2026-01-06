import ExcelJS from 'exceljs';
import { ConfigData } from '../types/config';

// Helper to normalize date to YYYY-MM-DD
export const normalizeDate = (value: any): string | null => {
  if (!value) return null;

  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'number') {
    // Excel serial number
    // ExcelJS handles this often, but if we get raw number:
    // Excel base date is usually 1899-12-30
    // But safely, let's assume if it comes from ExcelJS Cell.value, it might be an object or date.
    // If it's a number, we try to convert.
    // 25569 is diff between 1970 and 1900.
    date = new Date(Math.round((value - 25569) * 86400 * 1000));
  } else if (typeof value === 'string') {
    // Try parsing YYYY/MM/DD, YYYY-MM-DD, etc.
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      date = d;
    }
  }

  if (date && !isNaN(date.getTime())) {
    // Use local time parts to avoid UTC shifting issues if time is 00:00:00
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
};

export const readFileAsWorkbook = async (file: File): Promise<ExcelJS.Workbook> => {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
};

export const findHeaderRow = (sheet: ExcelJS.Worksheet, keywords: string[], maxRows = 10): number => {
  for (let r = 1; r <= maxRows; r++) {
    const row = sheet.getRow(r);
    let matchCount = 0;
    row.eachCell((cell) => {
      const val = String(cell.value).toLowerCase();
      if (keywords.some(k => val.includes(k.toLowerCase()))) {
        matchCount++;
      }
    });
    if (matchCount > 0) return r;
  }
  return -1;
};

export const getColumnIndexByHeader = (sheet: ExcelJS.Worksheet, rowIdx: number, keywords: string[]): number => {
  const row = sheet.getRow(rowIdx);
  let foundIdx = -1;
  row.eachCell((cell, colNumber) => {
    const val = String(cell.value).toLowerCase();
    // strict match or contains? "header rules" in config says includes or exact match?
    // Let's assume includes for robustness unless specified.
    // PRD says: "method: ヘッダ一致（dateHeadersのいずれか）" -> exact match or contains?
    // "normalize_header: trim + lower"
    if (keywords.some(k => val.includes(k.toLowerCase()))) {
      foundIdx = colNumber;
    }
  });
  return foundIdx;
};
