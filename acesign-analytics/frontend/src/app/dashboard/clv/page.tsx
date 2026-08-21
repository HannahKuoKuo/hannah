'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { FiTrendingUp, FiUsers, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

interface Customer {
  id: number;
  name: string;
  email: string;
  clv: number;
  rfmScore: number;
  churn_risk: number;
  total_revenue: number;
  purchase_count: number;
  predictedLifetime: number;
  monthlyValue: number;
}

interface CLVSummary {
  totalCustomers: number;
  avgCLV: number;
  medianCLV: number;
  totalRevenue: number;
}

interface Segment {
  size: number;
  percentage: number;
  avg_clv: number;
  retention_rate: number;
  avg_order_frequency: number;
  roas: number;
}

interface ChurnPredictionItem {
  id: number;
  name: string;
  email: string;
  churn_probability: number;
  days_inactive: number;
  recommendation: string;
}

interface ChurnPrediction {
  high_risk: ChurnPredictionItem[];
  medium_risk: ChurnPredictionItem[];
  low_risk: ChurnPredictionItem[];
  summary: {
    totalCustomers: number;
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
    avg_churn_risk: number;
  };
}

const SEGMENT_COLORS = {
  champions: '#10b981',
  loyal: '#3b82f6',
  at_risk: '#f59e0b',
  new: '#8b5cf6'
};

export default function CLVPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<CLVSummary | null>(null);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [survival, setSurvival] = useState<any[]>([]);
  const [segments, setSegments] = useState<Record<string, Segment>>({});
  const [churnPrediction, setChurnPrediction] = useState<ChurnPrediction | null>(null);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [segmentFilter, setSegmentFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analysisRes, cohortRes, survivalRes, segmentRes, churnRes, distRes] = await Promise.all([
          apiClient.getCLVAnalysis(segmentFilter),
          apiClient.getCohortAnalysis(),
          apiClient.getSurvivalCurves(),
          apiClient.getCustomerSegments(),
          apiClient.getChurnPrediction(),
          apiClient.getCLVDistribution()
        ]);

        setCustomers(analysisRes.customers);
        setSummary(analysisRes.summary);
        setCohorts(cohortRes.cohorts);
        setSurvival(survivalRes.survival);
        setSegments(segmentRes.segments);
        setChurnPrediction(churnRes.prediction ? churnRes : null);
        setDistribution(distRes.distribution);
      } catch (error) {
        console.error('Failed to fetch CLV data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [segmentFilter]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const segmentEntries = Object.entries(segments || {});

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Customer Lifetime Value</h1>
          <p className="text-slate-600 mt-2">Analyze customer value, retention, and churn prediction</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Avg CLV</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">${summary.avgCLV.toFixed(0)}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FiTrendingUp className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Median CLV</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">${summary.medianCLV.toFixed(0)}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <FiCheckCircle className="text-emerald-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Customers</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalCustomers}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FiUsers className="text-purple-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">${summary.totalRevenue.toFixed(0)}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <FiAlertCircle className="text-amber-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('segments')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'segments'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Segments
          </button>
          <button
            onClick={() => setActiveTab('cohorts')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'cohorts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cohorts
          </button>
          <button
            onClick={() => setActiveTab('churn')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'churn'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Churn Risk
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Survival Curves */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Survival Curves by Segment</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={survival}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" label={{ value: 'Months', position: 'insideBottomRight', offset: -5 }} />
                  <YAxis label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="overall" stroke="#3b82f6" name="Overall" />
                  <Line type="monotone" dataKey="high_value" stroke="#10b981" name="High Value" />
                  <Line type="monotone" dataKey="medium_value" stroke="#f59e0b" name="Medium Value" />
                  <Line type="monotone" dataKey="low_value" stroke="#ef4444" name="Low Value" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* CLV Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">CLV Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Customer Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Customer List */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Customer Details</h2>
                <select
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">All Segments</option>
                  <option value="high">High Value</option>
                  <option value="medium">Medium Value</option>
                  <option value="low">Low Value</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">CLV</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">RFM Score</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Churn Risk</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Monthly Value</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Purchases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-slate-900">{customer.name}</p>
                            <p className="text-xs text-slate-500">{customer.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">${customer.clv.toFixed(0)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-200 rounded-full h-2 max-w-xs">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(customer.rfmScore / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-slate-700 font-medium">{customer.rfmScore.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            customer.churn_risk > 50 ? 'bg-red-100 text-red-700' :
                            customer.churn_risk > 25 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {customer.churn_risk}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-900">${customer.monthlyValue.toFixed(0)}</td>
                        <td className="py-3 px-4 text-slate-700">{customer.purchase_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Segments Tab */}
        {activeTab === 'segments' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {segmentEntries.map(([name, data]) => (
                <div key={name} className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: SEGMENT_COLORS[name as keyof typeof SEGMENT_COLORS] }}>
                  <h3 className="text-lg font-bold text-slate-900 capitalize">{name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{data.size} customers ({data.percentage}%)</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Avg CLV:</span>
                      <span className="font-semibold text-slate-900">${data.avg_clv.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Retention:</span>
                      <span className="font-semibold text-slate-900">{data.retention_rate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Frequency:</span>
                      <span className="font-semibold text-slate-900">{data.avg_order_frequency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">ROAS:</span>
                      <span className="font-semibold text-slate-900">{data.roas.toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cohorts Tab */}
        {activeTab === 'cohorts' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Cohort Retention Analysis</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Cohort</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Size</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">M0</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">M1</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">M2</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">M3</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">M4</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">M5</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">M6</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Avg Revenue/User</th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((cohort) => (
                    <tr key={cohort.month} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{cohort.month}</td>
                      <td className="py-3 px-4 text-center text-slate-700">{cohort.cohortSize}</td>
                      <td className="py-3 px-4 text-center bg-green-50 font-semibold">{cohort.retention_0}%</td>
                      <td className="py-3 px-4 text-center" style={{
                        backgroundColor: cohort.retention_1 > 0 ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                      }}>
                        {cohort.retention_1 > 0 ? `${cohort.retention_1}%` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center" style={{
                        backgroundColor: cohort.retention_2 > 0 ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                      }}>
                        {cohort.retention_2 > 0 ? `${cohort.retention_2}%` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center" style={{
                        backgroundColor: cohort.retention_3 > 0 ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                      }}>
                        {cohort.retention_3 > 0 ? `${cohort.retention_3}%` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center" style={{
                        backgroundColor: cohort.retention_4 > 0 ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                      }}>
                        {cohort.retention_4 > 0 ? `${cohort.retention_4}%` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center" style={{
                        backgroundColor: cohort.retention_5 > 0 ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                      }}>
                        {cohort.retention_5 > 0 ? `${cohort.retention_5}%` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center" style={{
                        backgroundColor: cohort.retention_6 > 0 ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                      }}>
                        {cohort.retention_6 > 0 ? `${cohort.retention_6}%` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">${cohort.avg_revenue_per_user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Churn Tab */}
        {activeTab === 'churn' && churnPrediction && (
          <div className="space-y-8">
            {/* Churn Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                <p className="text-sm text-slate-600 font-medium">High Risk</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{churnPrediction.summary.high_risk_count}</p>
                <p className="text-xs text-slate-500 mt-2">Immediate action needed</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                <p className="text-sm text-slate-600 font-medium">Medium Risk</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{churnPrediction.summary.medium_risk_count}</p>
                <p className="text-xs text-slate-500 mt-2">Monitor closely</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <p className="text-sm text-slate-600 font-medium">Low Risk</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{churnPrediction.summary.low_risk_count}</p>
                <p className="text-xs text-slate-500 mt-2">Retain & nurture</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <p className="text-sm text-slate-600 font-medium">Avg Churn Risk</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{(churnPrediction.summary.avg_churn_risk * 100).toFixed(0)}%</p>
                <p className="text-xs text-slate-500 mt-2">Overall portfolio health</p>
              </div>
            </div>

            {/* Risk Tiers */}
            <div className="space-y-4">
              {[
                { title: 'High Risk Customers', data: churnPrediction.high_risk, color: 'red' },
                { title: 'Medium Risk Customers', data: churnPrediction.medium_risk, color: 'yellow' },
                { title: 'Low Risk Customers', data: churnPrediction.low_risk, color: 'green' }
              ].map(({ title, data, color }) => (
                <div key={title} className="bg-white rounded-lg shadow p-6">
                  <h3 className={`text-lg font-bold text-${color}-900 mb-4`}>{title}</h3>
                  <div className="space-y-3">
                    {data.map((customer) => (
                      <div key={customer.id} className={`p-4 bg-${color}-50 rounded-lg border border-${color}-200`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{customer.name}</p>
                            <p className="text-sm text-slate-600">{customer.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-700">{Math.round(customer.churn_probability * 100)}% risk</p>
                            <p className="text-xs text-slate-500">Inactive {customer.days_inactive}d</p>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-white rounded border border-slate-200">
                          <p className="text-sm text-slate-700">
                            <span className="font-semibold">Action:</span> {customer.recommendation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
