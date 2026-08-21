'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { FiPlay, FiSave, FiDownload, FiTrash2, FiChevronRight, FiClock, FiDatabase } from 'react-icons/fi';

interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTime: number;
  timestamp: string;
}

interface SavedQuery {
  id: number;
  name: string;
  query: string;
  description: string;
  created_at: string;
  execution_time: number;
  rows_returned: number;
}

interface TableSchema {
  column: string;
  type: string;
  nullable: boolean;
}

const SQL_TEMPLATES = [
  {
    name: 'Active Users',
    query: 'SELECT id, email, status, created_at FROM users WHERE status = \'active\' LIMIT 100'
  },
  {
    name: 'Campaign Conversions',
    query: 'SELECT campaigns.name, COUNT(conversions.id) as conversion_count, SUM(conversions.revenue) as total_revenue FROM campaigns LEFT JOIN conversions ON campaigns.id = conversions.campaign_id GROUP BY campaigns.id ORDER BY total_revenue DESC'
  },
  {
    name: 'User Revenue',
    query: 'SELECT users.email, COUNT(conversions.id) as order_count, SUM(conversions.revenue) as total_revenue FROM users LEFT JOIN conversions ON users.id = conversions.user_id GROUP BY users.id ORDER BY total_revenue DESC'
  }
];

export default function SQLEditorPage() {
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10');
  const [results, setResults] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<SavedQuery[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableSchema, setTableSchema] = useState<TableSchema[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);

  const pageSize = 20;

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [historyRes, tablesRes] = await Promise.all([
          apiClient.getQueryHistory(),
          apiClient.getAvailableTables()
        ]);

        setHistory(historyRes.data);
        setTables(tablesRes.tables);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };

    fetchInitialData();
  }, []);

  const handleExecute = async () => {
    setLoading(true);
    setCurrentPage(0);
    try {
      const res = await apiClient.executeQuery(query);
      setResults({
        columns: res.execution.columns,
        rows: res.execution.results,
        rowCount: res.execution.rowCount,
        executionTime: res.execution.executionTime,
        timestamp: res.execution.timestamp
      });
    } catch (error) {
      console.error('Failed to execute query:', error);
      alert('Failed to execute query. Please check the query syntax.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadQuery = (q: SavedQuery) => {
    setQuery(q.query);
  };

  const handleSaveQuery = async () => {
    if (!saveName.trim()) {
      alert('Please enter a query name');
      return;
    }

    try {
      await apiClient.saveQuery({
        name: saveName,
        query,
        description: saveDescription
      });

      alert('Query saved successfully!');
      setShowSaveDialog(false);
      setSaveName('');
      setSaveDescription('');

      // Refresh history
      const historyRes = await apiClient.getQueryHistory();
      setHistory(historyRes.data);
    } catch (error) {
      console.error('Failed to save query:', error);
      alert('Failed to save query');
    }
  };

  const handleToggleTable = async (tableName: string) => {
    if (expandedTables.has(tableName)) {
      setExpandedTables(prev => {
        const next = new Set(prev);
        next.delete(tableName);
        return next;
      });
    } else {
      try {
        const schemaRes = await apiClient.getTableSchema(tableName);
        setTableSchema(schemaRes.columns);
        setSelectedTable(tableName);
        setExpandedTables(prev => new Set(prev).add(tableName));
      } catch (error) {
        console.error('Failed to load schema:', error);
      }
    }
  };

  const handleDownloadCSV = () => {
    if (!results) return;

    let csv = results.columns.join(',') + '\n';
    results.rows.forEach(row => {
      csv += results.columns.map(col => {
        const value = row[col];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${Date.now()}.csv`;
    a.click();
  };

  const paginatedRows = results?.rows.slice(currentPage * pageSize, (currentPage + 1) * pageSize) || [];
  const totalPages = results ? Math.ceil(results.rowCount / pageSize) : 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex h-full bg-slate-900 text-slate-100">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-slate-700 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-sm font-bold text-slate-300 mb-3">TABLES</h2>
            <div className="space-y-1">
              {tables.map(table => (
                <div key={table}>
                  <button
                    onClick={() => handleToggleTable(table)}
                    className="w-full text-left text-sm px-3 py-2 hover:bg-slate-800 rounded flex items-center gap-2 text-slate-300"
                  >
                    <FiChevronRight size={14} className={expandedTables.has(table) ? 'rotate-90' : ''} />
                    <FiDatabase size={14} />
                    {table}
                  </button>

                  {expandedTables.has(table) && selectedTable === table && (
                    <div className="bg-slate-800 pl-4 py-2 space-y-1">
                      {tableSchema.map(col => (
                        <div key={col.column} className="text-xs py-1">
                          <p className="text-slate-400">{col.column}</p>
                          <p className="text-slate-500 text-xs">{col.type}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-slate-700 flex-1 overflow-y-auto">
            <h2 className="text-sm font-bold text-slate-300 mb-3">TEMPLATES</h2>
            <div className="space-y-2">
              {SQL_TEMPLATES.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(template.query)}
                  className="w-full text-left text-xs p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-slate-700 flex-1 overflow-y-auto">
            <h2 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <FiClock size={14} />
              HISTORY
            </h2>
            <div className="space-y-2">
              {history.slice(0, 10).map(q => (
                <button
                  key={q.id}
                  onClick={() => handleLoadQuery(q)}
                  className="w-full text-left text-xs p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                  title={q.query}
                >
                  <p className="font-medium truncate">{q.name}</p>
                  <p className="text-xs text-slate-600">{q.rows_returned} rows • {q.execution_time}ms</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Editor */}
          <div className="flex-1 flex flex-col border-b border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500 font-mono">SQL EDITOR</span>
              </div>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-32 p-3 bg-slate-950 border border-slate-700 rounded font-mono text-sm text-slate-100 resize-none focus:outline-none focus:border-blue-500"
                placeholder="SELECT * FROM users LIMIT 10"
                spellCheck="false"
              />
            </div>

            <div className="p-4 flex gap-2">
              <button
                onClick={handleExecute}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded font-medium text-sm transition"
              >
                <FiPlay size={16} />
                {loading ? 'Executing...' : 'Execute'}
              </button>

              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium text-sm transition"
              >
                <FiSave size={16} />
                Save
              </button>

              {results && (
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium text-sm transition"
                >
                  <FiDownload size={16} />
                  CSV
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            {results && (
              <>
                <div className="text-xs text-slate-400 mb-3">
                  {results.rowCount} rows returned • {results.executionTime}ms
                </div>

                <div className="flex-1 overflow-auto border border-slate-700 rounded">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-slate-800">
                      <tr>
                        {results.columns.map(col => (
                          <th
                            key={col}
                            className="px-4 py-2 text-left font-semibold text-slate-300 border-b border-slate-700 bg-slate-900"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-700 hover:bg-slate-800">
                          {results.columns.map(col => (
                            <td key={`${idx}-${col}`} className="px-4 py-2 text-slate-300 font-mono text-xs">
                              {row[col] !== null && row[col] !== undefined ? String(row[col]) : 'NULL'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
                    <div>
                      Page {currentPage + 1} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white rounded transition"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage === totalPages - 1}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white rounded transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {!results && (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <p className="mb-2">Execute a query to see results</p>
                  <p className="text-xs text-slate-500">Click Execute or use Ctrl+Enter</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Save Query</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Query Name</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Active Users"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuery}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Save Query
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
