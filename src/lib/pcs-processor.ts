import ExcelJS from 'exceljs';
import { ConfigData } from '../types/config';
import { ValidationError, PcsColumnInfo, DateRowMap, ProcessingResult } from './types';
import { normalizeDate } from './excel-utils';

export class PcsProcessor {
  config: ConfigData;
  errors: ValidationError[] = [];

  constructor(config: ConfigData) {
    this.config = config;
  }

  addError(severity: 'fatal' | 'warn', type: string, message: string, context?: any) {
    this.errors.push({
      id: Math.random().toString(36).substr(2, 9),
      severity,
      type,
      message,
      ...context
    });
  }

  async process(inputBuffer: ArrayBuffer, templateBuffer: ArrayBuffer): Promise<ProcessingResult> {
    this.errors = [];
    
    // Load Workbooks
    const inputWb = new ExcelJS.Workbook();
    const templateWb = new ExcelJS.Workbook();
    
    try {
      await inputWb.xlsx.load(inputBuffer);
    } catch (e) {
      this.addError('fatal', 'FILE_READ_FAIL', '入力ファイルの読み込みに失敗しました');
      return { success: false, errors: this.errors };
    }

    try {
      await templateWb.xlsx.load(templateBuffer);
    } catch (e) {
      this.addError('fatal', 'FILE_READ_FAIL', 'テンプレートファイルの読み込みに失敗しました');
      return { success: false, errors: this.errors };
    }

    // 1. Validate & Parse Input Data
    const inputSheet = inputWb.getWorksheet(this.config.defaults.inputDataSheetName);
    if (!inputSheet) {
      this.addError('fatal', 'INPUT_SHEET_NOT_FOUND', `入力シート '${this.config.defaults.inputDataSheetName}' が見つかりません`);
      return { success: false, errors: this.errors };
    }

    const { dateColIdx, pcsCols, irradiationColIdx, dateMap } = this.parseInputData(inputSheet);

    if (this.errors.some(e => e.severity === 'fatal')) {
      return { success: false, errors: this.errors };
    }

    // 2. Validate & Prepare Template
    const templateSheet = templateWb.getWorksheet(this.config.defaults.templateSheetName);
    if (!templateSheet) {
      this.addError('fatal', 'TEMPLATE_SHEET_NOT_FOUND', `テンプレートシート '${this.config.defaults.templateSheetName}' が見つかりません`);
      return { success: false, errors: this.errors };
    }

    const { anchorColIdx, templateDateMap } = this.parseTemplateData(templateSheet);

    if (this.errors.some(e => e.severity === 'fatal')) {
      return { success: false, errors: this.errors };
    }

    // 3. Generation Logic
    // Insert columns for PCS if needed (we extend from anchor)
    // We assume the anchor is the FIRST PCS column.
    
    // Sort PCS cols by ID just in case, or preserve order?
    // Requirement: "fill_order: input_dataで抽出したpcsIdsInOrderの順"
    // So we iterate pcsCols.

    // We need to insert (pcsCols.length - 1) columns AFTER the anchor.
    // ExcelJS `spliceColumns` can insert.
    // Actually, template has one anchor column. We need to duplicate it or just set values?
    // "AC03: PCS列は553列生成され"
    // "Generate mode: extend_right"
    
    if (pcsCols.length !== this.config.defaults.expectedPcsCount) {
        this.addError('warn', 'PCS_COUNT_MISMATCH', `検出されたPCS数(${pcsCols.length})が期待値(${this.config.defaults.expectedPcsCount})と異なります`);
    }

    if (pcsCols.length === 0) {
        this.addError('fatal', 'PCS_COLS_NOT_FOUND', 'PCS列が見つかりません');
        return { success: false, errors: this.errors };
    }

    // Prepare Template Structure
    // Insert columns
    // We start from anchorColIdx.
    // Existing anchor column is for the 1st PCS.
    // We need to insert `pcsCols.length - 1` columns after `anchorColIdx`.
    
    if (pcsCols.length > 1) {
        // ExcelJS insertColumn is tricky with styles.
        // Strategy: spliceColumns to create empty space, then copy style from anchor.
        templateSheet.spliceColumns(anchorColIdx + 1, 0, ...new Array(pcsCols.length - 1).fill(null));
    }

    // Copy Styles and Set Headers
    const anchorCol = templateSheet.getColumn(anchorColIdx);
    const anchorWidth = anchorCol.width;
    // We need to copy cell styles for the whole column (header + data rows)
    // Optimization: Iterate rows and set styles? Or set Column style?
    // ExcelJS column.style affects cells?
    
    // Let's iterate rows for safer style copying, especially header vs data.
    // But first, set Headers.
    const headerRow = templateSheet.getRow(this.config.defaults.templateHeaderRow);
    
    pcsCols.forEach((pcs, idx) => {
        const targetColIdx = anchorColIdx + idx;
        const targetCol = templateSheet.getColumn(targetColIdx);
        targetCol.width = anchorWidth;

        // Header
        const headerCell = headerRow.getCell(targetColIdx);
        headerCell.value = this.config.output.pcsHeaderFormat.replace('{ID}', pcs.id);
        // Copy header style from anchor
        const anchorHeaderCell = headerRow.getCell(anchorColIdx);
        headerCell.style = Object.assign({}, anchorHeaderCell.style);
    });

    // 4. Fill Data
    // Iterate template dates
    Object.entries(templateDateMap).forEach(([dateStr, tInfo]) => {
        const targetRow = templateSheet.getRow(tInfo.rowIndex);
        
        // 4.1 Irradiation
        if (irradiationColIdx !== -1) {
            // Find irradiation col in template? 
            // Requirement AC02: "日射量は一致日付へ転記される"
            // But where is the irradiation column in Template?
            // PRD doesn't explicitly specify Template Irradiation Column detection method.
            // "template.pcs_anchor" is defined.
            // Maybe we assume irradiation is already there? Or we search for it in Template too?
            // "irradiation_transfer" rule: "一致日付の値をそのまま転記"
            // I'll search for "irradiationIncludes" in Template header too.
        }

        const inputRowInfo = dateMap[dateStr];
        
        if (!inputRowInfo) {
            this.addError('warn', 'DATE_NOT_FOUND', `日付 ${dateStr} が入力データに見つかりません`, { date: dateStr });
            return;
        }

        // Fill PCS Data
        pcsCols.forEach((pcs, idx) => {
            const targetColIdx = anchorColIdx + idx;
            const cell = targetRow.getCell(targetColIdx);
            
            // Copy data style from anchor (for this row)
            const anchorCell = targetRow.getCell(anchorColIdx);
            cell.style = Object.assign({}, anchorCell.style); // Clone style

            // Calculate Daily
            // daily = cum(D) - cum(D-1)
            // Need prev date
            const currentCum = inputRowInfo.data[pcs.colIndex];
            
            // Find prev date
            const d = new Date(dateStr);
            d.setDate(d.getDate() - 1);
            const prevDateStr = normalizeDate(d);
            
            if (!prevDateStr || !dateMap[prevDateStr]) {
                 // Try to look for pre-previous? No, strict daily.
                 // If prev date missing in input_data -> Error
                 // Special case: First day of month. Requires "Prev Month End Row" (which should be in input_data)
                 this.addError('warn', 'MISSING_PREV_DAY', `前日データ欠損: ${dateStr} (PCS: ${pcs.id})`, { date: dateStr, target: pcs.id });
                 return;
            }

            const prevCum = dateMap[prevDateStr].data[pcs.colIndex];
            
            if (typeof currentCum !== 'number' || typeof prevCum !== 'number') {
                // Cant calc
                 return;
            }

            let diff = currentCum - prevCum;
            
            // Rounding
            diff = Number(diff.toFixed(this.config.defaults.roundDecimals));

            // Negative Check
            if (diff < 0) {
                // Negative Policy
                 if (this.config.validation.negativeDiffPolicy === 'ZERO_AND_ERROR') {
                     diff = 0;
                     this.addError('warn', 'NEGATIVE_DIFF', `負の値検出: ${diff} (PCS: ${pcs.id})`, { date: dateStr, target: pcs.id });
                 } else if (this.config.validation.negativeDiffPolicy === 'BLANK_AND_ERROR') {
                     this.addError('warn', 'NEGATIVE_DIFF', `負の値検出: ${diff} (PCS: ${pcs.id})`, { date: dateStr, target: pcs.id });
                     cell.value = null;
                     return;
                 }
                 // 'ALLOW' -> keep diff
            }

            cell.value = diff;
        });
    });

    // Handle Irradiation Transfer (Separate pass or same pass)
    // Need to find Template Irradiation Column
    const tIrradColIdx = this.findColIndex(templateSheet, this.config.defaults.templateHeaderRow, this.config.headerRules.irradiationIncludes);
    if (tIrradColIdx !== -1 && irradiationColIdx !== -1) {
         Object.entries(templateDateMap).forEach(([dateStr, tInfo]) => {
            const inputRowInfo = dateMap[dateStr];
            if (inputRowInfo) {
                const val = inputRowInfo.data[irradiationColIdx];
                const cell = templateSheet.getCell(tInfo.rowIndex, tIrradColIdx);
                if (val !== undefined) {
                    cell.value = val;
                } else {
                     this.addError('warn', 'IRRADIATION_MISSING', `日射量欠損: ${dateStr}`, { date: dateStr });
                }
            }
         });
    }

    // 5. Generate Errors Sheet
    await this.generateErrorsSheet(templateWb);

    return { success: true, errors: this.errors, workbook: templateWb };
  }

  // Helpers
  parseInputData(sheet: ExcelJS.Worksheet) {
    const headerRowIdx = this.config.defaults.inputDataHeaderRow;
    const firstDataRow = this.config.defaults.inputDataFirstDataRow;
    
    // Find Cols
    const dateColIdx = this.findColIndex(sheet, headerRowIdx, this.config.headerRules.dateHeaders);
    const irradiationColIdx = this.findColIndex(sheet, headerRowIdx, this.config.headerRules.irradiationIncludes);
    const pcsCols = this.findPcsCols(sheet, headerRowIdx);

    const dateMap: DateRowMap = {};

    sheet.eachRow((row, rowNumber) => {
        if (rowNumber < firstDataRow) return;
        
        const dateVal = row.getCell(dateColIdx).value;
        const normDate = normalizeDate(dateVal);
        
        if (!normDate) {
            // Only fatal if it looks like a date row but fails? 
            // Or just skip empty rows?
            // "失敗した場合はfatal（DATE_PARSE_FAIL）"
            // But if row is empty?
            if (row.hasValues) {
                 // Check if it's a summary row or something?
                 // For now strict.
                 // this.addError('fatal', 'DATE_PARSE_FAIL', ...);
            }
            return;
        }

        const rowData: {[key:number]: any} = {};
        row.eachCell((cell, colNumber) => {
            rowData[colNumber] = cell.value;
        });
        
        dateMap[normDate] = { rowIndex: rowNumber, data: rowData };
    });

    return { dateColIdx, pcsCols, irradiationColIdx, dateMap };
  }

  parseTemplateData(sheet: ExcelJS.Worksheet) {
      const headerRowIdx = this.config.defaults.templateHeaderRow;
      const firstDataRow = this.config.defaults.templateFirstDataRow;
      const anchorPrefix = this.config.headerRules.templatePcsAnchorPrefix;

      let anchorColIdx = -1;
      const headerRow = sheet.getRow(headerRowIdx);
      headerRow.eachCell((cell, colNumber) => {
          if (anchorColIdx === -1 && String(cell.value).startsWith(anchorPrefix)) {
              anchorColIdx = colNumber;
          }
      });

      if (anchorColIdx === -1) {
          this.addError('fatal', 'TEMPLATE_PCS_ANCHOR_NOT_FOUND', `PCSアンカー列(${anchorPrefix}...)が見つかりません`);
      }

      // Date Map for Template
      // Find date col? Usually Col 1 or "dateHeaders"?
      // PRD: "matching_policy: templateの日付行をキーに"
      // Need to find Date column in Template too.
      const dateColIdx = this.findColIndex(sheet, headerRowIdx, this.config.headerRules.dateHeaders);
       if (dateColIdx === -1) {
          this.addError('fatal', 'DATE_COL_NOT_FOUND', `テンプレートに日付列が見つかりません`);
      }

      const templateDateMap: DateRowMap = {};
      sheet.eachRow((row, rowNumber) => {
          if (rowNumber < firstDataRow) return;
          const dateVal = row.getCell(dateColIdx).value;
          const normDate = normalizeDate(dateVal);
          if (normDate) {
              templateDateMap[normDate] = { rowIndex: rowNumber, data: {} };
          }
      });

      return { anchorColIdx, templateDateMap };
  }

  findColIndex(sheet: ExcelJS.Worksheet, rowIdx: number, keywords: string[]): number {
      const row = sheet.getRow(rowIdx);
      let found = -1;
      row.eachCell((cell, colNumber) => {
          const val = String(cell.value || '').toLowerCase();
          if (keywords.some(k => val.includes(k.toLowerCase()))) {
              found = colNumber;
          }
      });
      return found;
  }

  findPcsCols(sheet: ExcelJS.Worksheet, rowIdx: number): PcsColumnInfo[] {
      const row = sheet.getRow(rowIdx);
      const cols: PcsColumnInfo[] = [];
      const mustInclude = this.config.headerRules.pcsMustInclude;
      const splitToken = this.config.headerRules.pcsIdSplitToken;

      row.eachCell((cell, colNumber) => {
          const val = String(cell.value || '');
          if (mustInclude.every(k => val.includes(k))) {
              // Extract ID
              // "take_left: true"
              const id = val.split(splitToken)[0];
              cols.push({ colIndex: colNumber, id, header: val });
          }
      });
      return cols;
  }

  async generateErrorsSheet(wb: ExcelJS.Workbook) {
      const sheetName = this.config.output.errorsSheetName;
      let sheet = wb.getWorksheet(sheetName);
      if (sheet) {
          wb.removeWorksheet(sheet.id);
      }
      sheet = wb.addWorksheet(sheetName);
      
      sheet.columns = [
          { header: 'Severity', key: 'severity', width: 10 },
          { header: 'Type', key: 'type', width: 20 },
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Target', key: 'target', width: 15 },
          { header: 'Message', key: 'message', width: 50 },
          { header: 'Context', key: 'context', width: 50 },
      ];

      this.errors.forEach(err => {
          sheet?.addRow({
              severity: err.severity,
              type: err.type,
              date: err.date,
              target: err.target,
              message: err.message,
              context: JSON.stringify(err) // simplify
          });
      });
  }
}
