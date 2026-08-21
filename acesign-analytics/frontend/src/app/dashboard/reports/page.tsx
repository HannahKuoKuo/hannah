'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { FiLoader, FiFileText, FiDownload, FiTrash2, FiPlus } from 'react-icons/fi';

interface Report {
  id: number;
  title: string;
  report_type: string;
  generated_at: string;
  file_path?: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getReports();
      setReports(response.data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMonthly = async () => {
    try {
      setGenerating(true);
      const response = await apiClient.generateMonthlyReport();
      toast.success('Monthly report generated!');
      setReports([response.report, ...reports]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateWeekly = async () => {
    try {
      setGenerating(true);
      const response = await apiClient.generateWeeklyReport();
      toast.success('Weekly report generated!');
      setReports([response.report, ...reports]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await apiClient.deleteReport(reportId);
      setReports(reports.filter((r) => r.id !== reportId));
      toast.success('Report deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FiLoader className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-600 mt-1">Generate and manage your marketing reports</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={handleGenerateMonthly}
          disabled={generating}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          <FiPlus />
          Generate Monthly Report
        </button>
        <button
          onClick={handleGenerateWeekly}
          disabled={generating}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          <FiPlus />
          Generate Weekly Report
        </button>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow">
        {reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900 flex items-center gap-2">
                      <FiFileText className="text-blue-600" />
                      {report.title}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {report.report_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(report.generated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {report.file_path && (
                          <button
                            className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition"
                            title="Download PDF"
                          >
                            <FiDownload size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition"
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FiFileText className="text-4xl text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">No reports yet</p>
            <p className="text-slate-500 text-sm">Generate your first report using the buttons above</p>
          </div>
        )}
      </div>
    </div>
  );
}
