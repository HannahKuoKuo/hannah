import { Link, useLocation } from 'react-router-dom'
import { FiHome, FiBarChart2, FiCalendar, FiFileText, FiSettings } from 'react-icons/fi'
import clsx from 'clsx'

const nav = [
  { path: '/', label: 'Dashboard', icon: FiHome },
  { path: '/analytics', label: 'Analytics', icon: FiBarChart2 },
  { path: '/content-calendar', label: 'Content Calendar', icon: FiCalendar },
  { path: '/reports', label: 'Reports', icon: FiFileText },
  { path: '/settings', label: 'Settings', icon: FiSettings },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold">ACE Analytics</h1>
      </div>
      <nav className="mt-6">
        {nav.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={clsx(
              'flex items-center px-6 py-3 transition-colors',
              location.pathname === path
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-slate-800'
            )}
          >
            <Icon className="w-5 h-5 mr-3" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
