'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import {
  FiFileText,
  FiLoader,
  FiDownload,
  FiTrash2,
  FiRefreshCw,
  FiSave,
  FiPlus,
  FiFilter,
  FiX,
  FiBarChart3
} from 'react-icons/fi';

interface Report {
  id: number;
  title: string;
  description: string;
  report_type: string;
  generated_at: string;
  data: any;
}

interface Template {
  id: number;
  template_name: string;
  config: any;
  created_at: string;
}

const REPORT_SOURCES = [
  { id: 'mailerlite', label: 'Email Campaigns', icon: '✉️' },
  { id: 'meta', label: 'Social Media', icon: '📱' },
  { id: 'utm', label: 'UTM Tracking', icon: '🔗' },
  { id: 'ga4', label: 'Google Analytics', icon: '📊' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' }
];

const METRICS = {
  mailerlite: [
    'open_rate',
    'click_rate',
    'campaign_count',
    'subscriber_count',
    'conversion_rate'
  ],
  meta: [
    'engagement_rate',
    'reach',
    'impressions',
    'follower_growth',
    'post_count'
  ],
  utm: [
    'click_count',
    'conversion_count',
    'ctr',
    'unique_visitors',
    'revenue'
  ],
  ga4: [
    'users',
    'sessions',
    'bounce_rate',
    'avg_session_duration',
    'conversion_value'
  ],
  linkedin: [
    'post_impressions',
    'engagement_rate',
    'follower_count',
    'connection_requests',
    'profile_views'
  ]
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomReportModal, setShowCustomReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'templates'>('reports');

  // Custom report form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sources: [] as string[],
    dateRange: 'last_30_days' as string,
    metrics: [] as string[],
    filters: {} as Record<string, any>,
    templateName: ''
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [reportsData, templatesData] = await Promise.all([
        apiClient.getReports(),
        apiClient.getReportTemplates()
      ]);

      setReports(reportsData.data || []);
      setTemplates(templatesData.data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSourceToggle = (sourceId: string) => {
    setFormData(prev => ({
      ...prev,
      sources: prev.sources.includes(sourceId)
        ? prev.sources.filter(s => s !== sourceId)
        : [...prev.sources, sourceId],
      metrics: []
    }));
  };

  const handleMetricToggle = (metric: string) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter(m => m !== metric)
        : [...prev.metrics, metric]
    }));
  };

  const getAvailableMetrics = () => {
    const available: string[] = [];
    formData.sources.forEach(source => {
      const metrics = METRICS[source as keyof typeof METRICS] || [];
      available.push(...metrics);
    });
    return [...new Set(available)];
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || formData.sources.length === 0 || formData.metrics.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const result = await apiClient.generateCustomReport({
        title: formData.title,
        description: formData.description,
        sources: formData.sources,
        dateRange: formData.dateRange,
        metrics: formData.metrics,
        filters: formData.filters,
        templateName: formData.templateName || undefined
      });

      toast.success('Report generated successfully!');
      setShowCustomReportModal(false);
      setFormData({
        title: '',
        description: '',
        sources: [],
        dateRange: 'last_30_days',
        metrics: [],
        filters: {},
        templateName: ''
      });
      fetchReports();
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await apiClient.deleteReport(reportId);
      toast.success('Report deleted');
      fetchReports();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete report');
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await apiClient.deleteReportTemplate(templateId);
      toast.success('Template deleted');
      fetchReports();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete template');
    }
  };

  const handleLoadTemplate = (template: Template) => {
    const config = typeof template.config === 'string' ? JSON.parse(template.config) : template.config;
    setFormData({
      title: `${template.template_name} - ${new Date().toLocaleDateString()}`,
      description: '',
      sources: config.sources || [],
      dateRange: config.dateRange || 'last_30_days',
      metrics: config.metrics || [],
      filters: config.filters || {},
      templateName: ''
    });
    setShowCustomReportModal(true);
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
          <p className="text-slate-600 mt-1">Generate and manage custom reports</p>
        </div>
        <button
          onClick={() => setShowCustomReportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus />
          New Report
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'reports'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiFileText />
              Reports ({reports.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'templates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiBarChart3 />
              Templates ({templates.length})
            </div>
          </button>
        </div>
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="grid gap-6">
          {reports.length > 0 ? (
            reports.map(report => (
              <div key={report.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900">{report.title}</h3>
                    {report.description && (
                      <p className="text-slate-600 text-sm mt-1">{report.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete report"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 font-medium mb-1">Type</p>
                    <p className="text-slate-900 capitalize">
                      {report.report_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium mb-1">Generated</p>
                    <p className="text-slate-900">
                      {new Date(report.generated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => apiClient.generateReportPDF(report.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      <FiDownload size={16} />
                      Download PDF
                    </button>
                  </div>
                </div>

                {report.report_type === 'custom' && report.data && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600 font-medium mb-2">Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {report.data.sources?.map((source: string) => (
                        <span key={source} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <FiFileText className="mx-auto text-4xl text-slate-300 mb-4" />
              <p className="text-slate-600">No reports generated yet</p>
            </div>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid gap-6">
          {templates.length > 0 ? (
            templates.map(template => (
              <div key={template.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900">{template.template_name}</h3>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleLoadTemplate(template)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Use template"
                    >
                      <FiRefreshCw size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete template"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-600 font-medium mb-2">Configuration</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-700">
                      <span className="font-medium">Sources:</span> {template.config?.sources?.join(', ') || 'None'}
                    </p>
                    <p className="text-slate-700">
                      <span className="font-medium">Metrics:</span> {template.config?.metrics?.length || 0}
                    </p>
                    <p className="text-slate-700">
                      <span className="font-medium">Created:</span> {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <FiBarChart3 className="mx-auto text-4xl text-slate-300 mb-4" />
              <p className="text-slate-600">No templates saved yet</p>
            </div>
          )}
        </div>
      )}

      {/* Custom Report Modal */}
      {showCustomReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Generate Custom Report</h2>
              <button
                onClick={() => setShowCustomReportModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleGenerateReport} className="p-6 space-y-6">
              {/* Title and Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Report Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Q4 Marketing Performance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    rows={3}
                    placeholder="Optional description"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date Range
                </label>
                <select
                  value={formData.dateRange}
                  onChange={(e) => setFormData({ ...formData, dateRange: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="last_7_days">Last 7 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="last_90_days">Last 90 Days</option>
                  <option value="last_year">Last Year</option>
                </select>
              </div>

              {/* Data Sources */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Data Sources *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {REPORT_SOURCES.map(source => (
                    <label key={source.id} className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.sources.includes(source.id)}
                        onChange={() => handleSourceToggle(source.id)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <span className="text-sm">{source.icon} {source.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              {formData.sources.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Metrics to Include *
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                    {getAvailableMetrics().map(metric => (
                      <label key={metric} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.metrics.includes(metric)}
                          onChange={() => handleMetricToggle(metric)}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">{metric.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Save as Template */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Save as Template (optional)
                </label>
                <input
                  type="text"
                  value={formData.templateName}
                  onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Monthly Marketing Report"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Generate Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomReportModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
