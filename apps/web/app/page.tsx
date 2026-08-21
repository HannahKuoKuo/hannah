'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-white">
            ACE Sign <span className="text-blue-500">Dashboard</span>
          </div>
          <nav className="hidden md:flex gap-8">
            <a href="#features" className="text-slate-400 hover:text-white transition">
              功能
            </a>
            <a href="#integrations" className="text-slate-400 hover:text-white transition">
              整合
            </a>
            <Link href="/auth/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              登入
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            完整的行銷監控平台
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            統一管理 EDM、Meta 社群媒體和廣告投放，獲取實時數據分析和詳細報告
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-semibold"
            >
              開始免費試用
            </Link>
            <Link
              href="/demo"
              className="px-8 py-3 border border-slate-600 text-white rounded-lg hover:border-slate-400 transition text-lg font-semibold"
            >
              查看演示
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">核心功能</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* EDM */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="text-xl font-bold text-white mb-3">EDM 追蹤管理</h3>
            <ul className="text-slate-400 space-y-2">
              <li>• 發送記錄和統計</li>
              <li>• 打開率/點擊率分析</li>
              <li>• 訂閱者管理</li>
              <li>• A/B 測試</li>
            </ul>
          </div>

          {/* Meta */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold text-white mb-3">Meta 社群管理</h3>
            <ul className="text-slate-400 space-y-2">
              <li>• 貼文排程發布</li>
              <li>• 互動分析</li>
              <li>• 粉絲統計</li>
              <li>• 廣告效果追蹤</li>
            </ul>
          </div>

          {/* Ads */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-white mb-3">廣告投放追蹤</h3>
            <ul className="text-slate-400 space-y-2">
              <li>• 多渠道監控</li>
              <li>• ROI 分析</li>
              <li>• 轉換追蹤</li>
              <li>• 預算管理</li>
            </ul>
          </div>

          {/* Analytics */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-3">實時儀表板</h3>
            <ul className="text-slate-400 space-y-2">
              <li>• 即時數據展示</li>
              <li>• 自定義圖表</li>
              <li>• KPI 監控</li>
              <li>• 趨勢分析</li>
            </ul>
          </div>

          {/* Reports */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-bold text-white mb-3">自動化報告</h3>
            <ul className="text-slate-400 space-y-2">
              <li>• 週期性報告</li>
              <li>• 自定義內容</li>
              <li>• PDF/CSV 導出</li>
              <li>• 自動郵件發送</li>
            </ul>
          </div>

          {/* Integration */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-bold text-white mb-3">第三方整合</h3>
            <ul className="text-slate-400 space-y-2">
              <li>• Meta Graph API</li>
              <li>• Google Ads API</li>
              <li>• Email Service</li>
              <li>• Stripe 支付</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">支持的整合</h2>
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="text-3xl mb-3">f</div>
            <p className="text-white font-semibold">Facebook</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="text-3xl mb-3">📷</div>
            <p className="text-white font-semibold">Instagram</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="text-3xl mb-3">🔤</div>
            <p className="text-white font-semibold">Google Ads</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="text-3xl mb-3">✉️</div>
            <p className="text-white font-semibold">Email Services</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg mb-20">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-6">準備好開始了嗎？</h2>
          <p className="text-lg text-blue-100 mb-8">立即註冊並獲得 14 天免費試用，無需信用卡</p>
          <Link
            href="/auth/register"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-slate-100 transition text-lg font-semibold"
          >
            立即開始
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-slate-400">
            <p>&copy; 2024 ACE Sign Marketing Dashboard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
