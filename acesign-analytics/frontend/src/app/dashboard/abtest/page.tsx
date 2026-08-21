'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import {
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiPlus,
  FiX,
  FiPlay,
  FiPause,
  FiZap,
  FiBarChart2
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Variant {
  id: string;
  name: string;
  traffic_allocation: number;
  visits: number;
  conversions: number;
  conversion_rate: number;
}

interface TestData {
  id: number;
  name: string;
  description: string;
  hypothesis: string;
  test_type: string;
  status: 'running' | 'completed' | 'paused';
  start_date: string;
  end_date?: string;
  variants: Variant[];
  sample_size: number;
  confidence_level: number;
}

export default function ABTestPage() {
  const [tests, setTests] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<TestData | null>(null);
  const [selectedTestStats, setSelectedTestStats] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hypothesis: '',
    test_type: 'website',
    variants: [
      { name: 'Control', traffic_allocation: 50 },
      { name: 'Variant A', traffic_allocation: 50 }
    ]
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testsRes, summaryRes] = await Promise.all([
        apiClient.getABTests(statusFilter === 'all' ? undefined : statusFilter),
        apiClient.getABTestSummary()
      ]);

      setTests(testsRes.data || []);
      setSummary(summaryRes.summary || {});
    } catch (error: any) {
      toast.error(error.message || 'Failed to load A/B tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchTestDetails = async (testId: number) => {
    try {
      const res = await apiClient.getABTest(testId);
      setSelectedTest(res.test);
      setSelectedTestStats(res.statistics);
    } catch (error: any) {
      toast.error('Failed to load test details');
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.variants.length < 2) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await apiClient.createABTest(formData);
      toast.success('A/B test created successfully!');
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        hypothesis: '',
        test_type: 'website',
        variants: [
          { name: 'Control', traffic_allocation: 50 },
          { name: 'Variant A', traffic_allocation: 50 }
        ]
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create test');
    }
  };

  const handleStatusChange = async (testId: number, newStatus: string) => {
    try {
      await apiClient.updateABTestStatus(testId, newStatus);
      toast.success(`Test ${newStatus}`);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update test');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getSignificanceIcon = (isSignificant: boolean) => {
    return isSignificant ? (
      <FiCheckCircle className="text-green-600" />
    ) : (
      <FiAlertCircle className="text-yellow-600" />
    );
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
          <h1 className="text-3xl font-bold text-slate-900">A/B Testing</h1>
          <p className="text-slate-600 mt-1">Optimize campaigns with statistically significant experiments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus />
          New Test
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <p className="text-slate-600 text-sm font-medium mb-2">Active Tests</p>
            <p className="text-3xl font-bold text-blue-900">{summary.runningTests}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <p className="text-slate-600 text-sm font-medium mb-2">Completed Tests</p>
            <p className="text-3xl font-bold text-green-900">{summary.completedTests}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <p className="text-slate-600 text-sm font-medium mb-2">Winners Found</p>
            <p className="text-3xl font-bold text-purple-900">{summary.significantWinners}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 border border-amber-200">
            <p className="text-slate-600 text-sm font-medium mb-2">Avg. Lift</p>
            <p className="text-3xl font-bold text-amber-900">+{summary.averageLift}%</p>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="mb-6 flex gap-2">
        {['all', 'running', 'completed', 'paused'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Tests List */}
      <div className="space-y-6">
        {tests.length > 0 ? (
          tests.map(test => (
            <div key={test.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
              <div className="p-6">
                {/* Test Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{test.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                        {test.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-2">{test.description}</p>
                    <p className="text-slate-600 text-sm italic">
                      <span className="font-semibold">Hypothesis:</span> {test.hypothesis}
                    </p>
                  </div>

                  {test.status === 'running' && (
                    <button
                      onClick={() => handleStatusChange(test.id, 'paused')}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      title="Pause test"
                    >
                      <FiPause size={18} />
                    </button>
                  )}
                  {test.status === 'paused' && (
                    <button
                      onClick={() => handleStatusChange(test.id, 'running')}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Resume test"
                    >
                      <FiPlay size={18} />
                    </button>
                  )}
                </div>

                {/* Variants Comparison */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Variant Performance</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {test.variants.map(variant => (
                      <div key={variant.id} className="border border-slate-200 rounded-lg p-4">
                        <p className="font-semibold text-slate-900 mb-2">{variant.name}</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Traffic:</span>
                            <span className="font-semibold">{variant.traffic_allocation}% ({variant.visits})</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Conversions:</span>
                            <span className="font-semibold">{variant.conversions}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600">Conv. Rate:</span>
                            <span className="font-bold text-lg text-blue-600">{variant.conversion_rate.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => fetchTestDetails(test.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium"
                >
                  <FiBarChart2 size={16} />
                  View Detailed Analysis
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FiZap className="mx-auto text-4xl text-slate-300 mb-4" />
            <p className="text-slate-600">No tests yet</p>
          </div>
        )}
      </div>

      {/* Test Details Modal */}
      {selectedTest && selectedTestStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">{selectedTest.name} - Analysis</h2>
              <button
                onClick={() => {
                  setSelectedTest(null);
                  setSelectedTestStats(null);
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-1">Lift</p>
                  <p className="text-2xl font-bold text-slate-900">{selectedTestStats.lift}%</p>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-1">Uplift</p>
                  <p className="text-2xl font-bold text-slate-900">{selectedTestStats.uplift}%</p>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-1">P-Value</p>
                  <p className="text-2xl font-bold text-slate-900">{selectedTestStats.pValue}</p>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-1">Statistical</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getSignificanceIcon(selectedTestStats.isSignificant)}
                    <span className="font-semibold">
                      {selectedTestStats.isSignificant ? 'Significant' : 'Not Yet'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div>
                <p className="font-semibold text-slate-900 mb-4">Conversion Rate Comparison</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: 'Control',
                        'Conversion Rate': selectedTestStats.control.conversionRate
                      },
                      {
                        name: 'Variant',
                        'Conversion Rate': selectedTestStats.variant.conversionRate
                      }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                    <Bar dataKey="Conversion Rate" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Winner Announcement */}
              {selectedTestStats.isSignificant && (
                <div className={`p-4 rounded-lg ${selectedTestStats.winner === 'variant' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-center gap-3">
                    <FiCheckCircle className={selectedTestStats.winner === 'variant' ? 'text-green-600' : 'text-blue-600'} size={24} />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {selectedTestStats.winner === 'variant' ? '🎉 Variant Wins!' : 'Control is Best'}
                      </p>
                      <p className="text-sm text-slate-600">
                        With {selectedTestStats.confidenceLevel}% confidence, the {selectedTestStats.winner === 'variant' ? 'variant' : 'control'} performs {Math.abs(parseFloat(selectedTestStats.lift)).toFixed(2)}% better
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendation */}
              {!selectedTestStats.isSignificant && (
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-sm text-slate-700">
                    This test needs more data for statistical significance. Keep running to gather more samples.
                  </p>
                </div>
              )}

              {/* Statistical Details */}
              <div className="border-t border-slate-200 pt-6">
                <p className="font-semibold text-slate-900 mb-3">Statistical Details</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Chi-Square Value</p>
                    <p className="font-semibold text-slate-900">{selectedTestStats.chiSquare}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Confidence Level</p>
                    <p className="font-semibold text-slate-900">{selectedTestStats.confidenceLevel}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Create New A/B Test</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Test Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Email Subject Line Test"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={3}
                  placeholder="Test description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hypothesis *</label>
                <textarea
                  value={formData.hypothesis}
                  onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={3}
                  placeholder="What do you expect will happen?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Test Type *</label>
                <select
                  value={formData.test_type}
                  onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="website">Website</option>
                  <option value="email">Email</option>
                  <option value="ad">Ad</option>
                  <option value="landing_page">Landing Page</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Create Test
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
