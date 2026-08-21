'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface OverviewData {
  edm: {
    total_campaigns: number;
    total_sent: number;
    total_opened: number;
    total_clicked: number;
  };
  meta: {
    total_posts: number;
    total_likes: number;
    total_comments: number;
    total_shares: number;
  };
  ads: {
    active_campaigns: number;
    total_spend: number;
    total_impressions: number;
    total_clicks: number;
    total_conversions: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchOverview(token);
  }, [router]);

  const fetchOverview = async (token: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/overview`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setOverview(response.data);
    } catch (err: any) {
      setError('Failed to fetch dashboard data');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            行銷儀表板
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
          >
            登出
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 overflow-x-auto">
            <Link
              href="/dashboard"
              className="px-4 py-4 border-b-2 border-blue-500 text-blue-400 font-semibold whitespace-nowrap"
            >
              概覽
            </Link>
            <Link
              href="/dashboard/edm"
              className="px-4 py-4 border-b-2 border-transparent text-slate-400 hover:text-white transition whitespace-nowrap"
            >
              EDM 管理
            </Link>
            <Link
              href="/dashboard/meta"
              className="px-4 py-4 border-b-2 border-transparent text-slate-400 hover:text-white transition whitespace-nowrap"
            >
              社群媒體
            </Link>
            <Link
              href="/dashboard/ads"
              className="px-4 py-4 border-b-2 border-transparent text-slate-400 hover:text-white transition whitespace-nowrap"
            >
              廣告追蹤
            </Link>
            <Link
              href="/dashboard/reports"
              className="px-4 py-4 border-b-2 border-transparent text-slate-400 hover:text-white transition whitespace-nowrap"
            >
              報告
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {overview && (
          <>
            {/* EDM Stats */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">📧 電子郵件行銷 (EDM)</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="text-slate-400 text-sm mb-2">已發送活動</div>
                  <div className="text-3xl font-bold text-white">
                    {overview.edm.total_campaigns}
                  </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="text-slate-400 text-sm mb-2">總收件人</div>
                  <div className="text-3xl font-bold text-white">
                    {overview.edm.total_sent?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="text-slate-400 text-sm mb-2">打開數</div>
                  <div className="text-3xl font-bold text-white">
                    {overview.edm.total_opened || 0}
                  </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="text-slate-400 text-sm mb-2">點擊數</div>
                  <div className="text-3xl font-bold text-white">
                    {overview.edm.total_clicked || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Meta Stats */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">📱 社群媒體 (Meta)</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="text-slate-400 text-sm mb-2">貼文總數</div>
                  <div className="text-3xl font-bold text-white">
                    {overview.meta.total_posts}
                  </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="text-slate-400 text-sm mb-2">讚數</div>
                  <div className="text-3xl font-bold text-white">
                    {overview.meta.total_likes?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="text-slate-400 text-sm mb-2">留言數</div>
                  <div className="text-3xl font-bold text-white">
                    {overview.meta.total_comments || 0}
                  </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="text-slate-400 text-sm mb-2">分享數</div>
                  <div className="text-3xl font-bold text-white">
                    {overview.meta.total_shares || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Ads Stats */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">🎯 廣告投放</h2>
              <div className="grid md:grid-cols-5 gap-4">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="text-slate-400 text-sm mb-2">活躍活動</div>
                  <div className="text-3xl font-bold text-white">
                    {overview.ads.active_campaigns}
                  </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="text-slate-400 text-sm mb-2">總支出</div>
                  <div className="text-3xl font-bold text-white">
                    ${overview.ads.total_spend?.toFixed(2) || 0}
                  </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="text-slate-400 text-sm mb-2">展示次數</div>
                  <div className="text-3xl font-bold text-white">
                    {(overview.ads.total_impressions / 1000).toFixed(1)}K
                  </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="text-slate-400 text-sm mb-2">點擊數</div>
                  <div className="text-3xl font-bold text-white">
                    {overview.ads.total_clicks?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="text-slate-400 text-sm mb-2">轉換數</div>
                  <div className="text-3xl font-bold text-white">
                    {overview.ads.total_conversions || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">快速操作</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <Link
                  href="/dashboard/edm/create"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
                >
                  建立 EDM 活動
                </Link>
                <Link
                  href="/dashboard/meta/schedule"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
                >
                  排程社群貼文
                </Link>
                <Link
                  href="/dashboard/ads/create"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
                >
                  建立廣告活動
                </Link>
                <Link
                  href="/dashboard/reports/generate"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
                >
                  生成報告
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
