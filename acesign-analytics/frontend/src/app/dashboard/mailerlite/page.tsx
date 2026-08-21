'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { FiLoader, FiRefreshCw, FiBarChart2, FiMail, FiUsers, FiTrendingUp, FiSearch } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Campaign {
  id: number;
  subject: string;
  status: string;
  sent_count: number;
  open_rate: number;
  click_rate: number;
  sent_at: string;
}

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#ea580c'];

export default function MailerlitePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [campaignsData, analyticsData] = await Promise.all([
        apiClient.getMailerliteCampaigns(50),
        apiClient.getMailerliteAnalytics(days)
      ]);

      setCampaigns(campaignsData.data);
      setAnalytics(analyticsData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load email data');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      await apiClient.syncMailerlite();
      await fetchData();
      toast.success('Email data synced!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync');
    }
  };

  const filteredCampaigns = campaigns.filter((c) =>
    c.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FiLoader className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  const performanceData = [
    {
      name: 'Open Rate',
      value: analytics?.avgOpenRate || 0,
      color: COLORS[0]
    },
    {
      name: 'Click Rate',
      value: analytics?.avgClickRate || 0,
      color: COLORS[1]
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Email Campaigns</h1>
          <p className="text-slate-600 mt-1">Monitor MailerLite email performance</p>
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
          </select>
          <button
            onClick={handleSync}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiRefreshCw />
            Sync
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Campaigns</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {analytics.totalCampaigns}
                </p>
              </div>
              <FiMail className="text-4xl text-blue-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Sent</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {(analytics.totalSent || 0).toLocaleString()}
                </p>
              </div>
              <FiUsers className="text-4xl text-green-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Avg Open Rate</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {(analytics.avgOpenRate || 0).toFixed(2)}%
                </p>
              </div>
              <FiTrendingUp className="text-4xl text-blue-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Avg Click Rate</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {(analytics.avgClickRate || 0).toFixed(2)}%
                </p>
              </div>
              <FiBarChart2 className="text-4xl text-purple-200" />
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Comparison */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Performance Metrics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb">
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Campaign Breakdown</h2>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">Sent</span>
                <span className="text-sm text-slate-600">
                  {campaigns.filter((c) => c.status === 'sent').length}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${(campaigns.filter((c) => c.status === 'sent').length / campaigns.length) * 100}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">Draft</span>
                <span className="text-sm text-slate-600">
                  {campaigns.filter((c) => c.status === 'draft').length}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full"
                  style={{
                    width: `${(campaigns.filter((c) => c.status === 'draft').length / campaigns.length) * 100}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">Scheduled</span>
                <span className="text-sm text-slate-600">
                  {campaigns.filter((c) => c.status === 'scheduled').length}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(campaigns.filter((c) => c.status === 'scheduled').length / campaigns.length) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredCampaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">
                    Open Rate
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">
                    Click Rate
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Sent Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    onClick={() => setSelectedCampaign(campaign)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {campaign.subject}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-slate-600">
                      {(campaign.sent_count || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {(campaign.open_rate || 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        {(campaign.click_rate || 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          campaign.status === 'sent'
                            ? 'bg-green-100 text-green-700'
                            : campaign.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(campaign.sent_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600">No campaigns found</p>
          </div>
        )}
      </div>

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Campaign Details</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Subject</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {selectedCampaign.subject}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">Recipients</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {(selectedCampaign.sent_count || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Status</p>
                  <p className="text-lg font-bold text-slate-900 mt-1 capitalize">
                    {selectedCampaign.status}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-600">Open Rate</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {(selectedCampaign.open_rate || 0).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Click Rate</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {(selectedCampaign.click_rate || 0).toFixed(2)}%
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600">Sent Date</p>
                <p className="text-slate-900 mt-1">
                  {new Date(selectedCampaign.sent_at).toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedCampaign(null)}
              className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
