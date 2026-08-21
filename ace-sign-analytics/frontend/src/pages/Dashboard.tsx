import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuthStore } from '../stores/authStore'
import StatCard from '../components/StatCard'

const data = [
  { date: 'Mon', visitors: 2400, engagement: 24 },
  { date: 'Tue', visitors: 1398, engagement: 22 },
  { date: 'Wed', visitors: 9800, engagement: 29 },
  { date: 'Thu', visitors: 3908, engagement: 20 },
  { date: 'Fri', visitors: 4800, engagement: 23 },
  { date: 'Sat', visitors: 3800, engagement: 25 },
  { date: 'Sun', visitors: 4300, engagement: 21 },
]

export default function Dashboard() {
  const { token } = useAuthStore()
  const [dashboardData, setDashboardData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/dashboard/overview', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const data = await response.json()
          setDashboardData(data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      }
    }

    fetchData()
  }, [token])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Visitors" value="12,543" trend="+12%" />
        <StatCard title="Engagement Rate" value="68%" trend="+5%" />
        <StatCard title="Email Subscribers" value="3,842" trend="+23%" />
        <StatCard title="Conversion Rate" value="4.2%" trend="+2.1%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Visitors Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="visitors" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Engagement Rate</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="engagement" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
