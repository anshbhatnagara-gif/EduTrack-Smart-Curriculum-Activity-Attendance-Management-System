import React from 'react';
import Pagination from './Pagination';
import LoadingTable from '../feedback/LoadingTable';
import EmptyState from '../feedback/EmptyState';
import ErrorState from '../feedback/ErrorState';

const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  error = null,
  onRetry = null,
  pagination = null,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display at this time.'
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <LoadingTable rows={5} cols={columns.length || 4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto min-w-full">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              {columns.map((col, idx) => (
                <th key={col.accessor || idx} scope="col" className="px-4 py-3 md:px-6">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {data.map((row, rIdx) => (
              <tr key={row.id || rIdx} className="hover:bg-slate-50/80 transition-colors">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="px-4 py-3.5 md:px-6 whitespace-nowrap text-slate-700 font-medium">
                    {col.render ? col.render(row) : row[col.accessor] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
};

export default DataTable;
