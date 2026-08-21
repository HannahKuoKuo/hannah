'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import {
  FiLoader,
  FiTrendingUp,
  FiBarChart2,
  FiFilter,
  FiDownload,
  FiInfo
} from 'react-icons/fi';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter
} from 'recharts';

interface ChannelROI {
  revenue: number;
  cost: number;
  roi: number;
  roas: number;
  conversions: number;
}

interface TimelineData {
  date: string;
  [key: string]: string | number;
}

interface RoiMatrixData {
  channel: string;
  cpc: number;
  ctr: number;
  conversions: number;
  revenue: number;
  roi: number;
}

const ATTRIBUTION_MODELS = [
  { id: 'first_touch', label: 'First Touch', description: '100% credit to first interaction' },
  { id: 'last_touch', label: 'Last Touch', description: '100% credit to final interaction' },
  { id: 'linear', label: 'Linear', description: 'Equal credit to all touches' },
  { id: 'time_decay', label: 'Time Decay', description: 'More credit to recent interactions' },
  { id: 'position_based', label: 'Position Based', description: '40% first, 40% last, 20% middle' }
];

const CHANNELS = [
  'facebook',
  'google_ads',
  'email',
  'instagram',
  'utm',
  'linkedin'
];

const CHANNEL_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  google_ads: '#4285F4',
  email: '#FF6B6B',
  instagram: '#E1306C',
  utm: '#10B981',
  linkedin: '#0077B5'
};

export default function RoiAttributionPage() {
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState('last_touch');
  const [roiData, setRoiData] = useState<Record<string, ChannelROI> | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [comparisonData, setComparisonData] = useState<Record<string, any> | null>(null);
  const [roiMatrix, setRoiMatrix] = useState<RoiMatrixData[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [selectedModel]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analysisData, timelineRes, comparisonRes, matrixRes] = await Promise.all([
        apiClient.getAttributionAnalysis(selectedModel),
        apiClient.getAttributionTimeline(selectedModel),
        apiClient.compareAttributionModels(),
        apiClient.getRoiMatrix(selectedModel)
      ]);

      setRoiData(analysisData.data);
      setSummary(analysisData.summary);
      setTimelineData(timelineRes.data || []);
      setComparisonData(comparisonRes.data || {});
      setRoiMatrix(matrixRes.data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load attribution data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FiLoader className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  const getRoiBadgeColor = (roi: number) => {
    if (roi >= 300) return 'bg-green-100 text-green-700';
    if (roi >= 100) return 'bg-blue-100 text-blue-700';
    if (roi >= 0) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Multi-Channel ROI & Attribution</h1>
        <p className="text-slate-600 mt-1">Analyze marketing channel performance and contribution to conversions</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <p className="text-slate-600 text-sm font-medium mb-2">Total Revenue Attribution</p>
            <p className="text-3xl font-bold text-blue-900">
              ${summary.totalRevenue?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <p className="text-slate-600 text-sm font-medium mb-2">Total Marketing Cost</p>
            <p className="text-3xl font-bold text-purple-900">
              ${summary.totalCost?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <p className="text-slate-600 text-sm font-medium mb-2">Average ROI</p>
            <p className="text-3xl font-bold text-green-900">
              {summary.averageROI?.toFixed(0)}%
            </p>
          </div>
        </div>
      )}

      {/* Attribution Model Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">Attribution Model</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ATTRIBUTION_MODELS.map(model => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`p-3 rounded-lg border-2 transition text-left ${
                selectedModel === model.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              title={model.description}
            >
              <p className="font-semibold text-sm text-slate-900">{model.label}</p>
              <p className="text-xs text-slate-600 mt-1">{model.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Channel ROI Performance */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Channel Performance Breakdown</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Channel</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">Revenue</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">Cost</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">ROI</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">ROAS</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {roiData && Object.entries(roiData).map(([channel, metrics]) => (
                <tr key={channel} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 capitalize">
                    {channel.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-slate-900">
                    ${metrics.revenue?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-slate-900">
                    ${metrics.cost?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <span className={`px-3 py-1 rounded-full font-semibold text-xs ${getRoiBadgeColor(metrics.roi)}`}>
                      {metrics.roi?.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-slate-900 font-semibold">
                    {metrics.roas?.toFixed(2)}x
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-slate-900">
                    {Math.round(metrics.conversions)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Revenue Attribution Over Time</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value}`} />
            <Legend />
            {CHANNELS.map(channel => (
              <Line
                key={channel}
                type="monotone"
                dataKey={channel}
                stroke={CHANNEL_COLORS[channel]}
                dot={false}
                name={channel.replace('_', ' ').toUpperCase()}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ROI Matrix: Cost per Click vs CTR */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Cost Efficiency vs Conversion Performance</h2>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="cpc" name="Cost Per Click ($)" />
            <YAxis type="number" dataKey="roi" name="ROI (%)" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            {roiMatrix.map((item, idx) => (
              <Scatter
                key={item.channel}
                name={item.channel}
                data={[item]}
                fill={CHANNEL_COLORS[item.channel]}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* ROI Matrix Table */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Performance Metrics Matrix</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Channel</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">CPC</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">CTR</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Conversions</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Revenue</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">ROI</th>
              </tr>
            </thead>
            <tbody>
              {roiMatrix.map(item => (
                <tr key={item.channel} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 capitalize">
                    {item.channel}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-slate-900">
                    ${item.cpc.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-slate-900">
                    {item.ctr.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-slate-900">
                    {item.conversions}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-slate-900">
                    ${item.revenue?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className={`px-3 py-1 rounded-full font-semibold text-xs ${getRoiBadgeColor(item.roi)}`}>
                      {item.roi}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Comparison */}
      {comparisonData && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiInfo className="text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Attribution Model Comparison</h2>
          </div>

          <p className="text-slate-600 text-sm mb-6">
            See how different attribution models allocate credit differently to the same conversions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(comparisonData).map(([modelName, channels]) => (
              <div key={modelName} className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-3 capitalize">
                  {modelName.replace('_', ' ')}
                </h3>
                <div className="space-y-2">
                  {Object.entries(channels).map(([channel, value]: [string, any]) => (
                    <div key={channel} className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 capitalize">{channel.replace('_', ' ')}</span>
                      <span className="font-semibold text-slate-900">
                        ${Math.round(value).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
