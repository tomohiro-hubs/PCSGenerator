import React, { createContext, useContext, useState } from 'react';
import { ValidationError } from '../lib/types';
import ExcelJS from 'exceljs';

interface ProcessingState {
  errors: ValidationError[];
  setErrors: (errors: ValidationError[]) => void;
  resultWorkbook: ExcelJS.Workbook | null;
  setResultWorkbook: (wb: ExcelJS.Workbook | null) => void;
  isProcessing: boolean;
  setIsProcessing: (loading: boolean) => void;
}

const ProcessingContext = createContext<ProcessingState | undefined>(undefined);

export const ProcessingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [resultWorkbook, setResultWorkbook] = useState<ExcelJS.Workbook | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <ProcessingContext.Provider value={{
      errors, setErrors,
      resultWorkbook, setResultWorkbook,
      isProcessing, setIsProcessing
    }}>
      {children}
    </ProcessingContext.Provider>
  );
};

export const useProcessing = () => {
  const context = useContext(ProcessingContext);
  if (!context) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
};
