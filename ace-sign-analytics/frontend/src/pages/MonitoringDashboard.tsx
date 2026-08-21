import { useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts'
import { FiDownload, FiTrendingUp } from 'react-icons/fi'
import DateRangeSelector from '../components/DateRangeSelector'
import PlatformSelector from '../components/PlatformSelector'
import toast from 'react-hot-toast'

// 模拟数据
const generateMockData = () => [
  { date: '8/15', meta: 4200, email: 2400, ga4: 2290 },
  { date: '8/16', meta: 3000, email: 1398, ga4: 2210 },
  { date: '8/17', meta: 2000, email: 9800, ga4: 2290 },
  { date: '8/18', meta: 2780, email: 3908, ga4: 2000 },
  { date: '8/19', meta: 1890, email: 4800, ga4: 2181 },
  { date: '8/20', meta: 2390, email: 3800, ga4: 2500 },
  { date: '8/21', meta: 3490, email: 4300, ga4: 2100 },
]

interface DateRange {
  startDate: string
  endDate: string
  label: string
}

export default function MonitoringDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    label: '本月',
  })

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'meta',
    'email',
    'ga4',
  ])

  const data = generateMockData()

  // 计算统计数据
  const stats = {
    meta: {
      total: 18360,
      avg: 2623,
      trend: '+12.5%',
      change: 'up',
    },
    email: {
      total: 36208,
      avg: 5173,
      trend: '+18.3%',
      change: 'up',
    },
    ga4: {
      total: 14571,
      avg: 2081,
      trend: '+5.2%',
      change: 'up',
    },
  }

  const handleExport = async () => {
    try {
      const csvContent = [
        ['日期', '平台', '数据'],
        ...data.flatMap((d) =>
          selectedPlatforms.map((p) => [
            d.date,
            p,
            (d as any)[p],
          ])
        ),
      ]
        .map((row) => row.join(','))
        .join('\n')

      const element = document.createElement('a')
      element.setAttribute(
        'href',
        'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent)
      )
      element.setAttribute('download', `analytics_${dateRange.startDate}_to_${dateRange.endDate}.csv`)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)

      toast.success('数据已导出为 CSV 文件')
    } catch (error) {
      toast.error('导出失败')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">监测仪表板</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiDownload className="w-5 h-5" />
          导出数据
        </button>
      </div>

      {/* 时间和平台选择 */}
      <DateRangeSelector onDateRangeChange={setDateRange} />
      <PlatformSelector
        selectedPlatforms={selectedPlatforms}
        onPlatformChange={setSelectedPlatforms}
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {selectedPlatforms.includes('meta') && (
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Meta (社媒)</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.meta.total.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-2">
              <FiTrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">{stats.meta.trend}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">平均值: {stats.meta.avg}</p>
          </div>
        )}

        {selectedPlatforms.includes('email') && (
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2">MailerLite (邮件)</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.email.total.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-2">
              <FiTrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">{stats.email.trend}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">平均值: {stats.email.avg}</p>
          </div>
        )}

        {selectedPlatforms.includes('ga4') && (
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2">GA4 (网站)</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.ga4.total.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-2">
              <FiTrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">{stats.ga4.trend}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">平均值: {stats.ga4.avg}</p>
          </div>
        )}
      </div>

      {/* 趋势图 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">数据趋势 ({dateRange.label})</h2>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => value.toLocaleString()} />
            <Legend />
            {selectedPlatforms.includes('meta') && (
              <Line
                type="monotone"
                dataKey="meta"
                stroke="#3b82f6"
                name="Meta 数据"
                strokeWidth={2}
              />
            )}
            {selectedPlatforms.includes('email') && (
              <Line
                type="monotone"
                dataKey="email"
                stroke="#a855f7"
                name="Email 数据"
                strokeWidth={2}
              />
            )}
            {selectedPlatforms.includes('ga4') && (
              <Line
                type="monotone"
                dataKey="ga4"
                stroke="#f97316"
                name="GA4 数据"
                strokeWidth={2}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 对比分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">平台数据对比</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => value.toLocaleString()} />
              <Legend />
              {selectedPlatforms.includes('meta') && (
                <Bar dataKey="meta" fill="#3b82f6" name="Meta" />
              )}
              {selectedPlatforms.includes('email') && (
                <Bar dataKey="email" fill="#a855f7" name="Email" />
              )}
              {selectedPlatforms.includes('ga4') && (
                <Bar dataKey="ga4" fill="#f97316" name="GA4" />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">数据分布</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => value.toLocaleString()} />
              <Legend />
              {selectedPlatforms.includes('meta') && (
                <Area
                  type="monotone"
                  dataKey="meta"
                  fill="#3b82f6"
                  stroke="#3b82f6"
                  opacity={0.3}
                  name="Meta"
                />
              )}
              {selectedPlatforms.includes('email') && (
                <Area
                  type="monotone"
                  dataKey="email"
                  fill="#a855f7"
                  stroke="#a855f7"
                  opacity={0.3}
                  name="Email"
                />
              )}
              {selectedPlatforms.includes('ga4') && (
                <Area
                  type="monotone"
                  dataKey="ga4"
                  fill="#f97316"
                  stroke="#f97316"
                  opacity={0.3}
                  name="GA4"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 详细数据表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">详细数据</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-6 font-semibold text-gray-900">日期</th>
                {selectedPlatforms.includes('meta') && (
                  <th className="text-right py-3 px-6 font-semibold text-gray-900">Meta</th>
                )}
                {selectedPlatforms.includes('email') && (
                  <th className="text-right py-3 px-6 font-semibold text-gray-900">Email</th>
                )}
                {selectedPlatforms.includes('ga4') && (
                  <th className="text-right py-3 px-6 font-semibold text-gray-900">GA4</th>
                )}
                <th className="text-right py-3 px-6 font-semibold text-gray-900">合计</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-6 text-gray-700 font-medium">{row.date}</td>
                  {selectedPlatforms.includes('meta') && (
                    <td className="py-3 px-6 text-right text-gray-700">{row.meta.toLocaleString()}</td>
                  )}
                  {selectedPlatforms.includes('email') && (
                    <td className="py-3 px-6 text-right text-gray-700">{row.email.toLocaleString()}</td>
                  )}
                  {selectedPlatforms.includes('ga4') && (
                    <td className="py-3 px-6 text-right text-gray-700">{row.ga4.toLocaleString()}</td>
                  )}
                  <td className="py-3 px-6 text-right font-semibold text-gray-900">
                    {(
                      (selectedPlatforms.includes('meta') ? row.meta : 0) +
                      (selectedPlatforms.includes('email') ? row.email : 0) +
                      (selectedPlatforms.includes('ga4') ? row.ga4 : 0)
                    ).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
