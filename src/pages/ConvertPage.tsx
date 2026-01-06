import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useProcessing } from '../context/ProcessingContext';
import { PcsProcessor } from '../lib/pcs-processor';
import { Upload, FileUp, CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react';
import { saveAs } from 'file-saver';

const ConvertPage: React.FC = () => {
  const { config } = useConfig();
  const { setErrors, setResultWorkbook, resultWorkbook, isProcessing, setIsProcessing } = useProcessing();
  const [inputDataFile, setInputDataFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<{ fatal: number; warn: number } | null>(null);

  const handleValidate = async () => {
    if (!config || !inputDataFile || !templateFile) return;

    setIsProcessing(true);
    setSummary(null);
    setErrors([]);
    setResultWorkbook(null);

    // Small delay to allow UI to update
    await new Promise(r => setTimeout(r, 100));

    try {
      const inputBuffer = await inputDataFile.arrayBuffer();
      const templateBuffer = await templateFile.arrayBuffer();

      const processor = new PcsProcessor(config);
      const result = await processor.process(inputBuffer, templateBuffer);

      setErrors(result.errors);
      
      const fatalCount = result.errors.filter(e => e.severity === 'fatal').length;
      const warnCount = result.errors.filter(e => e.severity === 'warn').length;
      
      setSummary({ fatal: fatalCount, warn: warnCount });

      if (result.success && result.workbook) {
        setResultWorkbook(result.workbook);
      }
    } catch (e) {
      console.error(e);
      alert('処理中に予期せぬエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!resultWorkbook) return;
    const buffer = await resultWorkbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'filled_template.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">ファイル選択</h3>
            <p className="mt-1 text-sm text-gray-500">
              月次データ(Excel)とテンプレート(Excel)を選択してください。
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2 space-y-4">
            
            {/* Input Data File */}
            <div className="col-span-6 sm:col-span-4">
              <label className="block text-sm font-medium text-gray-700">月次データ ({config?.defaults.inputDataSheetName})</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary transition-colors">
                <div className="space-y-1 text-center">
                   {inputDataFile ? (
                      <div className="flex flex-col items-center">
                        <FileUp className="mx-auto h-12 w-12 text-primary" />
                        <p className="text-sm text-gray-900 font-medium">{inputDataFile.name}</p>
                        <p className="text-xs text-gray-500">{(inputDataFile.size / 1024).toFixed(1)} KB</p>
                        <button onClick={() => setInputDataFile(null)} className="text-xs text-red-500 hover:text-red-700 mt-2">解除</button>
                      </div>
                   ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="input-data-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                          <span>ファイルを選択</span>
                          <input id="input-data-upload" name="input-data-upload" type="file" className="sr-only" accept=".xlsx, .xls" onChange={(e) => e.target.files && setInputDataFile(e.target.files[0])} />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">Excel files (.xlsx)</p>
                    </>
                   )}
                </div>
              </div>
            </div>

             {/* Template File */}
             <div className="col-span-6 sm:col-span-4">
              <label className="block text-sm font-medium text-gray-700">テンプレート ({config?.defaults.templateSheetName})</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary transition-colors">
                <div className="space-y-1 text-center">
                   {templateFile ? (
                      <div className="flex flex-col items-center">
                        <FileUp className="mx-auto h-12 w-12 text-primary" />
                        <p className="text-sm text-gray-900 font-medium">{templateFile.name}</p>
                        <p className="text-xs text-gray-500">{(templateFile.size / 1024).toFixed(1)} KB</p>
                        <button onClick={() => setTemplateFile(null)} className="text-xs text-red-500 hover:text-red-700 mt-2">解除</button>
                      </div>
                   ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="template-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                          <span>ファイルを選択</span>
                          <input id="template-upload" name="template-upload" type="file" className="sr-only" accept=".xlsx, .xls" onChange={(e) => e.target.files && setTemplateFile(e.target.files[0])} />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">Excel files (.xlsx)</p>
                    </>
                   )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!inputDataFile || !templateFile || isProcessing}
                onClick={handleValidate}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                  ${(!inputDataFile || !templateFile || isProcessing) ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'}`}
              >
                {isProcessing ? '処理中...' : '検証 (Validate)'}
              </button>
            </div>

          </div>
        </div>
      </div>

      {summary && (
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 animate-fade-in">
           <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">検証結果</h3>
           
           <div className="flex space-x-4 mb-6">
              <div className={`flex-1 p-4 rounded-lg border ${summary.fatal > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                 <div className="flex items-center">
                    {summary.fatal > 0 ? <XCircle className="text-red-500 mr-2" /> : <CheckCircle className="text-green-500 mr-2" />}
                    <div>
                      <p className="text-sm font-medium text-gray-900">Fatal Errors</p>
                      <p className={`text-2xl font-bold ${summary.fatal > 0 ? 'text-red-600' : 'text-green-600'}`}>{summary.fatal}</p>
                    </div>
                 </div>
              </div>

              <div className={`flex-1 p-4 rounded-lg border ${summary.warn > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                 <div className="flex items-center">
                    <AlertTriangle className={`${summary.warn > 0 ? 'text-yellow-500' : 'text-green-500'} mr-2`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Warnings</p>
                      <p className={`text-2xl font-bold ${summary.warn > 0 ? 'text-yellow-600' : 'text-green-600'}`}>{summary.warn}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex justify-between items-center">
             <div className="text-sm text-gray-500">
               {summary.fatal > 0 ? '重大なエラーがあるため生成できません。' : '検証が完了しました。生成可能です。'}
               {summary.warn > 0 && summary.fatal === 0 && ' (警告が含まれています)'}
             </div>
             <button
               disabled={summary.fatal > 0}
               onClick={handleDownload}
               className={`inline-flex items-center justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
                 ${summary.fatal > 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
             >
               <Download className="mr-2 h-4 w-4" />
               生成・ダウンロード (Generate)
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ConvertPage;
