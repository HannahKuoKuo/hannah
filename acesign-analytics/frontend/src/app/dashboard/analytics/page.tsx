'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { FiLoader, FiRefreshCw } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [channels, setChannels] = useState<any>(null);
  const [roi, setROI] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [summaryData, channelData, roiData] = await Promise.all([
        apiClient.getAnalyticsSummary(days),
        apiClient.getAnalyticsChannels(days),
        apiClient.getAnalyticsROI(days)
      ]);

      setSummary(summaryData);
      setChannels(channelData);
      setROI(roiData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load analytics');
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-600 mt-1">Comprehensive marketing performance analysis</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-600 text-sm font-medium">Total Users</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{summary?.ga?.users.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-600 text-sm font-medium">Conversions</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{summary?.ga?.conversions}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-600 text-sm font-medium">Revenue</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">${summary?.ga?.revenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-600 text-sm font-medium">Conv. Rate</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {roi?.conversionRate.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Channel Performance</h2>
          {channels && channels.data ? (
            <div className="space-y-3">
              {channels.data.map((channel: any) => (
                <div key={channel.channel}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{channel.channel}</span>
                    <span className="text-sm text-slate-600">{channel.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${channel.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">No data available</p>
          )}
        </div>

        {/* ROI Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">ROI Metrics</h2>
          {roi && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700">Revenue per User</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ${roi.revenuePerUser.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Revenue per Conversion</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ${roi.revenuePerConversion.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ${roi.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
