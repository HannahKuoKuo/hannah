'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import {
  FiHome,
  FiBarChart2,
  FiMail,
  FiShare2,
  FiLink2,
  FiCalendar,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiMenu
} from 'react-icons/fi';
import { useState } from 'react';
import clsx from 'clsx';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/dashboard/roi-attribution', label: 'ROI & Attribution', icon: FiBarChart2 },
  { href: '/dashboard/analytics', label: 'Analytics', icon: FiBarChart2 },
  { href: '/dashboard/mailerlite', label: 'Email Campaigns', icon: FiMail },
  { href: '/dashboard/social', label: 'Social Media', icon: FiShare2 },
  { href: '/dashboard/utm', label: 'UTM Tracking', icon: FiLink2 },
  { href: '/dashboard/content-calendar', label: 'Content Calendar', icon: FiCalendar },
  { href: '/dashboard/clv', label: 'Customer Value', icon: FiBarChart2 },
  { href: '/dashboard/sql-editor', label: 'SQL Editor', icon: FiFileText },
  { href: '/dashboard/python-analytics', label: 'Python Analytics', icon: FiFileText },
  { href: '/dashboard/kpi', label: 'KPI Dashboard', icon: FiBarChart2 },
  { href: '/dashboard/reports', label: 'Reports', icon: FiFileText },
  { href: '/dashboard/settings', label: 'Settings', icon: FiSettings }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    logout();
    router.push('/auth/login');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-600 text-white"
      >
        <FiMenu size={24} />
      </button>

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-full w-64 bg-slate-900 text-white shadow-lg transition-transform duration-300 z-40',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold">
              A
            </div>
            <span className="font-bold text-lg">ACE Analytics</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-2 rounded-lg transition',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-slate-300 hover:bg-slate-800 rounded-lg transition"
          >
            <FiLogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}
    </>
  );
}
