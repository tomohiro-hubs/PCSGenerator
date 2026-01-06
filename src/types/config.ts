export interface ConfigData {
  defaults: {
    inputDataSheetName: string;
    inputDataHeaderRow: number;
    inputDataFirstDataRow: number;
    templateSheetName: string;
    templateHeaderRow: number;
    templateFirstDataRow: number;
    expectedPcsCount: number;
    roundDecimals: number;
  };
  headerRules: {
    dateHeaders: string[];
    irradiationIncludes: string[];
    pcsMustInclude: string[];
    pcsIdSplitToken: string;
    templatePcsAnchorPrefix: string;
  };
  output: {
    pcsHeaderFormat: string;
    errorsSheetName: string;
  };
  validation: {
    requirePrevMonthEndRow: boolean;
    skipFirstDataRowInOutput: boolean;
    negativeDiffPolicy: string;
    missingPrevDayPolicy: string;
  };
}

export interface ConfigState {
  config: ConfigData | null;
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  reloadConfig: () => Promise<void>;
  updateConfig: (newConfig: ConfigData) => void;
  resetConfig: () => void;
}
