import React, { useState, useMemo } from 'react';
import { useProcessing } from '../context/ProcessingContext';
import { AlertTriangle, XCircle, Search, Filter } from 'lucide-react';

const ErrorsPage: React.FC = () => {
  const { errors } = useProcessing();
  const [filterText, setFilterText] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'fatal' | 'warn'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default new first? Or severity?

  const filteredErrors = useMemo(() => {
    return errors
      .filter(e => {
        if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
        if (filterText) {
          const lower = filterText.toLowerCase();
          return (
            e.type.toLowerCase().includes(lower) ||
            e.message.toLowerCase().includes(lower) ||
            (e.date && e.date.includes(lower)) ||
            (e.target && e.target.toLowerCase().includes(lower))
          );
        }
        return true;
      })
      .sort((a, b) => {
          // Sort by Severity first (Fatal > Warn) then Date
          if (a.severity !== b.severity) {
             return a.severity === 'fatal' ? -1 : 1;
          }
          if (a.date && b.date) {
              return sortOrder === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
          }
          return 0;
      });
  }, [errors, filterText, severityFilter, sortOrder]);

  if (errors.length === 0) {
    return (
      <div className="text-center py-12 bg-white shadow rounded-lg">
        <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center rounded-full bg-gray-100">
          <CheckCircleIcon className="h-6 w-6" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">エラーはありません</h3>
        <p className="mt-1 text-sm text-gray-500">変換処理を実行するか、エラーが発生していません。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
           <h3 className="text-lg font-medium leading-6 text-gray-900">エラー一覧 ({errors.length})</h3>
           
           <div className="flex space-x-2 w-full sm:w-auto">
             <div className="relative rounded-md shadow-sm flex-1 sm:flex-initial">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                  placeholder="検索 (Type, Message...)"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
             </div>
             
             <select
                className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
             >
               <option value="all">全て</option>
               <option value="fatal">Fatalのみ</option>
               <option value="warn">Warnのみ</option>
             </select>
           </div>
        </div>

        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredErrors.map((error) => (
                      <tr key={error.id} className={error.severity === 'fatal' ? 'bg-red-50' : 'bg-white'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${error.severity === 'fatal' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {error.severity === 'fatal' ? <XCircle className="w-4 h-4 mr-1"/> : <AlertTriangle className="w-4 h-4 mr-1"/>}
                            {error.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{error.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{error.date || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{error.target || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 break-words max-w-xs">{error.message}</td>
                      </tr>
                    ))}
                    {filteredErrors.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">条件に一致するエラーはありません</td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function CheckCircleIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

export default ErrorsPage;
