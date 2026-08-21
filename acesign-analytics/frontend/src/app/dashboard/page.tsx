'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { FiLoader, FiRefreshCw, FiMail, FiShare2, FiLink2, FiTrendingUp } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardData {
  summary: {
    emailCampaigns: number;
    socialEngagement: {
      meta: {
        likes: number;
        comments: number;
      };
      linkedin: {
        engagement: number;
      };
    };
    utm: {
      links: number;
      clicks: number;
    };
    analytics: {
      users: number;
      revenue: number;
    };
  };
  recentReports: any[];
}

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#ea580c'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDashboard();
      setData(response);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await apiClient.refreshDashboard();
      await fetchDashboard();
      toast.success('Dashboard refreshed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FiLoader className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Failed to load dashboard</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const channelData = [
    {
      name: 'Email',
      value: data.summary.emailCampaigns,
      color: COLORS[0]
    },
    {
      name: 'Social',
      value: data.summary.socialEngagement.meta.likes + data.summary.socialEngagement.meta.comments,
      color: COLORS[1]
    },
    {
      name: 'UTM',
      value: data.summary.utm.clicks,
      color: COLORS[2]
    },
    {
      name: 'Organic',
      value: Math.max(data.summary.analytics.users - data.summary.utm.clicks, 0),
      color: COLORS[3]
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's your marketing overview.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Email Campaigns */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Email Campaigns</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {data.summary.emailCampaigns}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiMail className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>

        {/* Social Engagement */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Social Engagement</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {data.summary.socialEngagement.meta.likes + data.summary.socialEngagement.meta.comments}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <FiShare2 className="text-red-600 text-2xl" />
            </div>
          </div>
        </div>

        {/* UTM Clicks */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">UTM Clicks</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {data.summary.utm.clicks}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiLink2 className="text-green-600 text-2xl" />
            </div>
          </div>
        </div>

        {/* Website Traffic */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Website Users</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {data.summary.analytics.users.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <FiTrendingUp className="text-orange-600 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Channel Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Channel Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={channelData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {channelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Engagement Breakdown</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Email Engagement</span>
                <span className="text-sm text-slate-600">{data.summary.emailCampaigns}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (data.summary.emailCampaigns / Math.max(...channelData.map((d) => d.value))) * 100,
                      100
                    )}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Social Engagement</span>
                <span className="text-sm text-slate-600">
                  {data.summary.socialEngagement.meta.likes + data.summary.socialEngagement.meta.comments}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      ((data.summary.socialEngagement.meta.likes + data.summary.socialEngagement.meta.comments) /
                        Math.max(...channelData.map((d) => d.value))) *
                        100,
                      100
                    )}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">UTM Clicks</span>
                <span className="text-sm text-slate-600">{data.summary.utm.clicks}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (data.summary.utm.clicks / Math.max(...channelData.map((d) => d.value))) * 100,
                      100
                    )}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Recent Reports</h2>
          <a href="/reports" className="text-blue-600 hover:text-blue-700 font-medium">
            View All
          </a>
        </div>

        {data.recentReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                    Title
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                    Generated
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recentReports.map((report: any) => (
                  <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">{report.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {report.report_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(report.generated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-600 text-center py-8">No reports yet. Generate your first report!</p>
        )}
      </div>
    </div>
  );
}
