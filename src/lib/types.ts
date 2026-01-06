export interface ValidationError {
  id: string;
  severity: 'fatal' | 'warn';
  type: string;
  date?: string;
  target?: string;
  message: string;
  context?: string;
}

export interface ProcessingResult {
  success: boolean;
  errors: ValidationError[];
  workbook?: any; // ExcelJS.Workbook
}

export interface PcsColumnInfo {
  colIndex: number;
  id: string;
  header: string;
}

export interface DateRowMap {
  [dateStr: string]: {
    rowIndex: number;
    data: { [colIndex: number]: any };
  };
}
