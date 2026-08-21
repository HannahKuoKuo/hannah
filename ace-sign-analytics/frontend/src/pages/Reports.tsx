import { useState } from 'react'
import { FiDownload } from 'react-icons/fi'

const reports = [
  {
    id: 1,
    title: 'August 2024 Performance Report',
    date: '2024-08-31',
    type: 'Monthly',
    metrics: 45,
  },
  {
    id: 2,
    title: 'Q3 2024 Analytics Summary',
    date: '2024-09-30',
    type: 'Quarterly',
    metrics: 120,
  },
  {
    id: 3,
    title: 'Campaign ROI Analysis',
    date: '2024-08-25',
    type: 'Campaign',
    metrics: 32,
  },
]

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all ${
              selectedReport === report.id ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'
            }`}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Type: <span className="font-medium">{report.type}</span></p>
              <p>Generated: <span className="font-medium">{new Date(report.date).toLocaleDateString()}</span></p>
              <p>Metrics: <span className="font-medium">{report.metrics}</span></p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
              }}
              className="mt-4 flex items-center gap-2 w-full justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              Download
            </button>
          </div>
        ))}
      </div>

      {selectedReport && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Report Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Total Visitors</p>
              <p className="text-3xl font-bold text-gray-900">45,230</p>
              <p className="text-sm text-green-600 mt-2">+15.3% from previous period</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Engagement Rate</p>
              <p className="text-3xl font-bold text-gray-900">68%</p>
              <p className="text-sm text-green-600 mt-2">+5.2% from previous period</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
