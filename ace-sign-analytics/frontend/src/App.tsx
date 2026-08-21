import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import MonitoringDashboard from './pages/MonitoringDashboard'
import ContentCalendar from './pages/ContentCalendar'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function App() {
  const { token } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {token ? (
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/monitoring" element={<MonitoringDashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/content-calendar" element={<ContentCalendar />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default App
