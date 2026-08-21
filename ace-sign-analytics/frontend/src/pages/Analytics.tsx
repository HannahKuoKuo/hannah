import { useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const metaData = [
  { name: 'Instagram', value: 45 },
  { name: 'Facebook', value: 30 },
  { name: 'TikTok', value: 25 },
]

const emailData = [
  { campaign: 'Q1 Campaign', opens: 1200, clicks: 400, conversions: 120 },
  { campaign: 'Q2 Campaign', opens: 2400, clicks: 1398, conversions: 221 },
  { campaign: 'Q3 Campaign', opens: 2290, clicks: 9800, conversions: 229 },
  { campaign: 'Q4 Campaign', opens: 2000, clicks: 9800, conversions: 200 },
]

const COLORS = ['#3b82f6', '#10b981', '#f59e0b']

export default function Analytics() {
  const [dateRange, setDateRange] = useState('month')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Social Media Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metaData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {metaData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Email Campaign Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={emailData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="campaign" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="opens" fill="#3b82f6" />
              <Bar dataKey="clicks" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Detailed Metrics</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Metric</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Value</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700">Total Impressions</td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">125,432</td>
                <td className="py-3 px-4 text-right text-green-600">+12.5%</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700">Total Engagement</td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">8,243</td>
                <td className="py-3 px-4 text-right text-green-600">+8.2%</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700">Email Opens</td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">45,821</td>
                <td className="py-3 px-4 text-right text-green-600">+15.3%</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700">Website Clicks</td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">12,456</td>
                <td className="py-3 px-4 text-right text-red-600">-5.2%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
