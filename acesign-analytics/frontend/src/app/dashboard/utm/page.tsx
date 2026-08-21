'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { FiLoader, FiRefreshCw, FiPlus, FiCopy, FiTrash2, FiBarChart2, FiSearch, FiX } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface UTMLink {
  id: number;
  short_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content?: string;
  utm_term?: string;
  click_count: number;
  created_at: string;
}

interface UTMStats {
  link: UTMLink;
  stats: {
    total_clicks: number;
    by_country?: Record<string, number>;
    by_device?: Record<string, number>;
    by_browser?: Record<string, number>;
    by_os?: Record<string, number>;
  };
}

export default function UTMPage() {
  const [links, setLinks] = useState<UTMLink[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedLink, setSelectedLink] = useState<UTMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    original_url: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [linksData, summaryData] = await Promise.all([
        apiClient.getUTMLinks(100),
        apiClient.getUTMCampaignSummary()
      ]);
      setLinks(linksData.data);
      setSummary(summaryData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load UTM data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.original_url || !formData.utm_source || !formData.utm_medium || !formData.utm_campaign) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newLink = await apiClient.generateUTMLink(formData);
      setLinks([newLink, ...links]);
      setShowModal(false);
      setFormData({
        original_url: '',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_content: '',
        utm_term: ''
      });
      toast.success('UTM link created!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create link');
    }
  };

  const handleViewStats = async (linkId: number) => {
    try {
      const stats = await apiClient.getUTMLinkStats(linkId);
      setSelectedLink(stats);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load stats');
    }
  };

  const handleDeleteLink = async (linkId: number) => {
    if (!confirm('Delete this UTM link?')) return;

    try {
      await apiClient.deleteUTMLink(linkId);
      setLinks(links.filter((l) => l.id !== linkId));
      toast.success('Link deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete link');
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Copied to clipboard!');
  };

  const filteredLinks = links.filter((link) =>
    link.utm_campaign.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.utm_source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.short_url.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-slate-900">UTM Tracking</h1>
          <p className="text-slate-600 mt-1">Generate and monitor UTM links</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FiPlus />
          Generate Link
        </button>
      </div>

      {/* Summary Stats */}
      {summary && summary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Total Links</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{links.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Total Clicks</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {links.reduce((sum, l) => sum + (l.click_count || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Top Campaign</p>
            <p className="text-lg font-bold text-slate-900 mt-2">
              {summary[0]?.utm_campaign || 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns, sources, or URLs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Links Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredLinks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Source / Medium
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Short URL
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLinks.map((link) => (
                  <tr key={link.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {link.utm_campaign}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {link.utm_source} / {link.utm_medium}
                    </td>
                    <td className="px-6 py-4 text-sm text-center font-bold text-slate-900">
                      {link.click_count || 0}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <code className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">
                        {link.short_url}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(link.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyLink(link.short_url)}
                          className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition"
                          title="Copy"
                        >
                          <FiCopy size={16} />
                        </button>
                        <button
                          onClick={() => handleViewStats(link.id)}
                          className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition"
                          title="View Stats"
                        >
                          <FiBarChart2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
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
            <p className="text-slate-600">No UTM links yet</p>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Generate UTM Link</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleGenerateLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Original URL *
                </label>
                <input
                  type="url"
                  name="original_url"
                  value={formData.original_url}
                  onChange={handleChange}
                  placeholder="https://example.com/page"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Source *
                </label>
                <input
                  type="text"
                  name="utm_source"
                  value={formData.utm_source}
                  onChange={handleChange}
                  placeholder="google, facebook, email, etc."
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Medium *
                </label>
                <input
                  type="text"
                  name="utm_medium"
                  value={formData.utm_medium}
                  onChange={handleChange}
                  placeholder="cpc, social, email, etc."
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Campaign *
                </label>
                <input
                  type="text"
                  name="utm_campaign"
                  value={formData.utm_campaign}
                  onChange={handleChange}
                  placeholder="campaign-name"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Content (Optional)
                </label>
                <input
                  type="text"
                  name="utm_content"
                  value={formData.utm_content}
                  onChange={handleChange}
                  placeholder="ad-variant, button-text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Term (Optional)
                </label>
                <input
                  type="text"
                  name="utm_term"
                  value={formData.utm_term}
                  onChange={handleChange}
                  placeholder="keyword"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Generate Link
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {selectedLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Link Statistics</h2>
              <button
                onClick={() => setSelectedLink(null)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <FiX />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-600 text-sm">Total Clicks</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {selectedLink.stats.total_clicks || 0}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-600 text-sm">Devices</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {Object.keys(selectedLink.stats.by_device || {}).length}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-600 text-sm">Browsers</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {Object.keys(selectedLink.stats.by_browser || {}).length}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-600 text-sm">Countries</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {Object.keys(selectedLink.stats.by_country || {}).length}
                </p>
              </div>
            </div>

            {/* Device Breakdown */}
            {selectedLink.stats.by_device && Object.keys(selectedLink.stats.by_device).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Device Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(selectedLink.stats.by_device).map(([device, count]) => (
                    <div key={device}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 capitalize">{device}</span>
                        <span className="text-sm text-slate-600">{count}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${((count as number) / selectedLink.stats.total_clicks) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedLink(null)}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 font-medium py-2 px-4 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
