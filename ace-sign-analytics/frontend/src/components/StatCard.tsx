import { FiTrendingUp } from 'react-icons/fi'

interface StatCardProps {
  title: string
  value: string
  trend?: string
}

export default function StatCard({ title, value, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <div className="flex items-center text-sm text-green-600">
            <FiTrendingUp className="w-4 h-4 mr-1" />
            {trend}
          </div>
        )}
      </div>
    </div>
  )
}
