import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { ConfigData } from '../types/config';
import { Save, RotateCcw } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { config, updateConfig, resetConfig } = useConfig();
  const [formData, setFormData] = useState<ConfigData | null>(null);

  useEffect(() => {
    if (config) {
      setFormData(JSON.parse(JSON.stringify(config))); // Deep copy
    }
  }, [config]);

  const handleChange = (section: keyof ConfigData, key: string, value: any) => {
    if (!formData) return;
    
    setFormData({
      ...formData,
      [section]: {
        ...formData[section as keyof ConfigData],
        [key]: value
      }
    });
  };

  const handleSave = () => {
    if (formData) {
      updateConfig(formData);
      alert('設定を保存しました');
    }
  };

  const handleReset = () => {
    if (confirm('設定を初期値に戻しますか？')) {
      resetConfig();
    }
  };

  if (!formData) return null;

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">設定</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            アプリケーションの動作設定を変更します（ローカル保存のみ）。
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleReset}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            初期化
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Save className="mr-2 h-4 w-4" />
            保存
          </button>
        </div>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          
          <div className="sm:col-span-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">デフォルト設定</h4>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">入力データ シート名</label>
            <input
              type="text"
              value={formData.defaults.inputDataSheetName}
              onChange={(e) => handleChange('defaults', 'inputDataSheetName', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">テンプレート シート名</label>
            <input
              type="text"
              value={formData.defaults.templateSheetName}
              onChange={(e) => handleChange('defaults', 'templateSheetName', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">入力データ ヘッダ行</label>
            <input
              type="number"
              value={formData.defaults.inputDataHeaderRow}
              onChange={(e) => handleChange('defaults', 'inputDataHeaderRow', parseInt(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">テンプレート ヘッダ行</label>
            <input
              type="number"
              value={formData.defaults.templateHeaderRow}
              onChange={(e) => handleChange('defaults', 'templateHeaderRow', parseInt(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">期待するPCS数</label>
            <input
              type="number"
              value={formData.defaults.expectedPcsCount}
              onChange={(e) => handleChange('defaults', 'expectedPcsCount', parseInt(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>

           <div className="sm:col-span-6 mt-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">検証・出力設定</h4>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">PCS差分が負の場合</label>
            <select
              value={formData.validation.negativeDiffPolicy}
              onChange={(e) => handleChange('validation', 'negativeDiffPolicy', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="BLANK_AND_ERROR">空欄 + エラー記録</option>
              <option value="ZERO_AND_ERROR">0 + エラー記録</option>
              <option value="ALLOW">そのまま出力</option>
            </select>
          </div>

           <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">前日データ欠損時</label>
            <select
              value={formData.validation.missingPrevDayPolicy}
              onChange={(e) => handleChange('validation', 'missingPrevDayPolicy', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="BLANK_AND_ERROR">空欄 + エラー記録</option>
              <option value="ALLOW">計算スキップ</option>
            </select>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
