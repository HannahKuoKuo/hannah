'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiAlertCircle, FiCheckCircle, FiPlus, FiX } from 'react-icons/fi';

interface KPI {
  id: number;
  name: string;
  description: string;
  category: string;
  current_value: number;
  target_value: number;
  threshold_warning: number;
  threshold_critical: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: number;
  last_updated: string;
}

interface KPIAlert {
  id: number;
  kpi_id: number;
  severity: 'warning' | 'critical';
  message: string;
  triggered_at: string;
}

const STATUS_COLORS = {
  healthy: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-600' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'text-yellow-600' },
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-600' }
};

export default function KPIDashboard() {
  const [kpis, setKPIs] = useState<KPI[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [alerts, setAlerts] = useState<KPIAlert[]>([]);
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
  const [kpiHistory, setKPIHistory] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showCreateKPI, setShowCreateKPI] = useState(false);
  const [newKPI, setNewKPI] = useState({
    name: '',
    description: '',
    category: 'acquisition',
    formula: '',
    target_value: 0,
    unit: '$'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpisRes, dashboardRes, comparisonRes] = await Promise.all([
          apiClient.getKPIs(),
          apiClient.getKPIDashboard(),
          apiClient.getKPIComparison()
        ]);

        setKPIs(kpisRes.data);
        setDashboard(dashboardRes);
        setComparison(comparisonRes.data);
      } catch (error) {
        console.error('Failed to fetch KPI data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelectKPI = async (kpi: KPI) => {
    setSelectedKPI(kpi);
    try {
      const [historyRes, alertsRes] = await Promise.all([
        apiClient.getKPIHistory(kpi.id),
        apiClient.getKPIAlerts(kpi.id)
      ]);
      setKPIHistory(historyRes.history);
      setAlerts(alertsRes.data);
    } catch (error) {
      console.error('Failed to fetch KPI details:', error);
    }
  };

  const handleCreateKPI = async () => {
    try {
      await apiClient.createKPI(newKPI);
      alert('KPI created successfully!');
      const res = await apiClient.getKPIs();
      setKPIs(res.data);
      setShowCreateKPI(false);
      setNewKPI({
        name: '',
        description: '',
        category: 'acquisition',
        formula: '',
        target_value: 0,
        unit: '$'
      });
    } catch (error) {
      console.error('Failed to create KPI:', error);
      alert('Failed to create KPI');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const statusColors = dashboard && STATUS_COLORS[dashboard.summary as any];

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">KPI Tracking Dashboard</h1>
            <p className="text-slate-600 mt-2">Monitor key performance indicators and business metrics</p>
          </div>
          <button
            onClick={() => setShowCreateKPI(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            <FiPlus size={18} />
            New KPI
          </button>
        </div>

        {/* Summary Cards */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-slate-600 text-sm font-medium">Total KPIs</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{dashboard.summary.total_kpis}</p>
              <p className="text-xs text-slate-500 mt-2">{dashboard.summary.healthy} healthy</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <p className="text-slate-600 text-sm font-medium">Healthy</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{dashboard.summary.healthy}</p>
              <p className="text-xs text-slate-500 mt-2">On target performance</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <p className="text-slate-600 text-sm font-medium">Warnings</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{dashboard.summary.warning}</p>
              <p className="text-xs text-slate-500 mt-2">Needs attention</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <p className="text-slate-600 text-sm font-medium">Critical</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{dashboard.summary.critical}</p>
              <p className="text-xs text-slate-500 mt-2">Immediate action needed</p>
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
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'comparison'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Period Comparison
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'alerts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Alerts
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top Performers & Needs Attention */}
            {dashboard && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Performers */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Top Performers</h2>
                  <div className="space-y-3">
                    {dashboard.top_performers.map((kpi: any) => (
                      <div key={kpi.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{kpi.name}</p>
                          <p className="text-sm text-slate-600">{kpi.value}</p>
                        </div>
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                          <FiTrendingUp size={16} />
                          {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Needs Attention */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Needs Attention</h2>
                  <div className="space-y-3">
                    {dashboard.needs_attention.map((kpi: any) => (
                      <div key={kpi.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{kpi.name}</p>
                          <p className="text-sm text-slate-600">{kpi.value} / {kpi.target}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-yellow-600">{kpi.gap}%</p>
                          <p className="text-xs text-slate-500">below target</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">All KPIs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.map(kpi => {
                  const colors = STATUS_COLORS[kpi.status];
                  return (
                    <div
                      key={kpi.id}
                      onClick={() => handleSelectKPI(kpi)}
                      className={`rounded-lg shadow p-6 cursor-pointer transition hover:shadow-lg border ${colors.bg} ${colors.border}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className={`font-semibold ${colors.text}`}>{kpi.name}</p>
                          <p className="text-xs text-slate-600 mt-1">{kpi.description}</p>
                        </div>
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                          {kpi.status === 'healthy' && <FiCheckCircle className={colors.icon} size={20} />}
                          {kpi.status === 'warning' && <FiAlertCircle className={colors.icon} size={20} />}
                          {kpi.status === 'critical' && <FiAlertCircle className={colors.icon} size={20} />}
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-baseline gap-2">
                          <p className="text-3xl font-bold text-slate-900">
                            {kpi.current_value}
                          </p>
                          <p className="text-sm text-slate-600">{kpi.unit}</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Target: {kpi.target_value} {kpi.unit}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-600">
                          Gap: {((kpi.current_value - kpi.target_value) / kpi.target_value * 100).toFixed(1)}%
                        </div>
                        <div className={`flex items-center gap-1 font-semibold ${kpi.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {kpi.trend > 0 ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                          {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected KPI Details */}
            {selectedKPI && kpiHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedKPI.name} - Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={kpiHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      name="Current Value"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#10b981"
                      name="Target"
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Period-over-Period Comparison</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="kpi" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" fill="#3b82f6" name="Current" />
                <Bar dataKey="previous" fill="#9ca3af" name="Previous" />
                <Bar dataKey="target" fill="#10b981" name="Target" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-semibold text-green-900 mb-2">Improving</p>
                <p className="text-3xl font-bold text-green-600">{comparison.filter((k: any) => k.change > 0).length}</p>
                <p className="text-sm text-green-700">KPIs trending positively</p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <p className="font-semibold text-red-900 mb-2">Declining</p>
                <p className="text-3xl font-bold text-red-600">{comparison.filter((k: any) => k.change < 0).length}</p>
                <p className="text-sm text-red-700">KPIs trending negatively</p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {dashboard?.recent_alerts && dashboard.recent_alerts.length > 0 ? (
              dashboard.recent_alerts.map((alert: any, idx: number) => (
                <div
                  key={idx}
                  className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                    alert.severity === 'critical' ? 'border-red-500' : 'border-yellow-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{alert.kpi}</p>
                      <p className={`text-sm mt-1 ${
                        alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {alert.severity.toUpperCase()} - {alert.time}
                      </p>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600">
                      <FiX size={20} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <FiCheckCircle className="mx-auto text-green-600 mb-4" size={48} />
                <p className="text-slate-900 font-semibold">All KPIs are performing well</p>
                <p className="text-slate-600 text-sm mt-2">No active alerts at this time</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create KPI Modal */}
      {showCreateKPI && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create New KPI</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">KPI Name</label>
                <input
                  type="text"
                  value={newKPI.name}
                  onChange={(e) => setNewKPI({ ...newKPI, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Customer Acquisition Cost"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newKPI.description}
                  onChange={(e) => setNewKPI({ ...newKPI, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What does this KPI measure?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={newKPI.category}
                  onChange={(e) => setNewKPI({ ...newKPI, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="acquisition">Acquisition</option>
                  <option value="engagement">Engagement</option>
                  <option value="conversion">Conversion</option>
                  <option value="retention">Retention</option>
                  <option value="efficiency">Efficiency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Value</label>
                <input
                  type="number"
                  value={newKPI.target_value}
                  onChange={(e) => setNewKPI({ ...newKPI, target_value: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreateKPI(false)}
                  className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateKPI}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Create KPI
                </button>
              </div>
            </div>
          </div>
        )}
      )}
    </div>
  );
}
