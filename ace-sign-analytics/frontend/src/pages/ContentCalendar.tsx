import { useState } from 'react'
import { FiPlus } from 'react-icons/fi'

const calendarEvents = [
  {
    id: 1,
    title: 'Product Launch Post',
    date: '2024-08-15',
    platform: 'Instagram',
    status: 'scheduled',
  },
  {
    id: 2,
    title: 'Customer Testimonial',
    date: '2024-08-18',
    platform: 'Facebook',
    status: 'draft',
  },
  {
    id: 3,
    title: 'Weekly Newsletter',
    date: '2024-08-20',
    platform: 'Email',
    status: 'scheduled',
  },
]

export default function ContentCalendar() {
  const [showModal, setShowModal] = useState(false)
  const [events, setEvents] = useState(calendarEvents)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="w-5 h-5" />
          Schedule Content
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-4">{day}</h3>
            <div className="space-y-2">
              {events
                .filter((e) => new Date(e.date).toLocaleString('en-US', { weekday: 'short' }) === day)
                .map((event) => (
                  <div
                    key={event.id}
                    className="text-xs bg-blue-50 border border-blue-200 rounded p-2 cursor-pointer hover:bg-blue-100"
                  >
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-gray-600">{event.platform}</p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Scheduled Content</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Title</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Platform</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Scheduled</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-6 text-gray-700">{event.title}</td>
                  <td className="py-3 px-6 text-gray-700">{event.platform}</td>
                  <td className="py-3 px-6 text-gray-700">{new Date(event.date).toLocaleDateString()}</td>
                  <td className="py-3 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.status === 'scheduled'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {event.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Schedule Content</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option>Instagram</option>
                  <option>Facebook</option>
                  <option>Twitter</option>
                  <option>Email</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="datetime-local" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
