import { useState } from 'react'
import { FiSave } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function Settings() {
  const [formData, setFormData] = useState({
    mailerlite: '',
    metaAppId: '',
    metaPageId: '',
    ga4PropertyId: '',
    emailNotifications: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Settings saved successfully!')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-gray-200">API Integrations</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">MailerLite API Token</label>
            <input
              type="password"
              name="mailerlite"
              value={formData.mailerlite}
              onChange={handleChange}
              placeholder="Enter your MailerLite API token"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Your API token is encrypted and never shared</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meta App ID</label>
            <input
              type="text"
              name="metaAppId"
              value={formData.metaAppId}
              onChange={handleChange}
              placeholder="Enter your Meta App ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meta Page ID</label>
            <input
              type="text"
              name="metaPageId"
              value={formData.metaPageId}
              onChange={handleChange}
              placeholder="Enter your Meta Page ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GA4 Property ID</label>
            <input
              type="text"
              name="ga4PropertyId"
              value={formData.ga4PropertyId}
              onChange={handleChange}
              placeholder="Enter your GA4 Property ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="emailNotifications"
              checked={formData.emailNotifications}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label className="ml-3 text-sm font-medium text-gray-700">
              Send email notifications for scheduled reports
            </label>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiSave className="w-5 h-5" />
            Save Settings
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 pb-4 border-b border-gray-200">Account</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Email Address</p>
            <p className="text-lg font-medium text-gray-900">hannah@acesign.com.au</p>
          </div>
          <button className="text-sm text-blue-600 hover:underline">Change Password</button>
        </div>
      </div>
    </div>
  )
}
