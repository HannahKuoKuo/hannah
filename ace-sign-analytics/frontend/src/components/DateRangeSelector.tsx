import { useState } from 'react'
import { FiCalendar } from 'react-icons/fi'

interface DateRange {
  startDate: string
  endDate: string
  label: string
}

interface DateRangeSelectorProps {
  onDateRangeChange: (range: DateRange) => void
}

export default function DateRangeSelector({ onDateRangeChange }: DateRangeSelectorProps) {
  const [selectedRange, setSelectedRange] = useState<string>('month')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')
  const [showCustom, setShowCustom] = useState(false)

  const getDateRange = (type: string): DateRange => {
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    let startDate: Date
    let label = ''

    switch (type) {
      case 'today':
        startDate = new Date(startOfToday)
        label = '今天'
        break
      case 'week':
        startDate = new Date(startOfToday)
        startDate.setDate(startDate.getDate() - startDate.getDay())
        label = '本周'
        break
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        label = '本月'
        break
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3)
        startDate = new Date(today.getFullYear(), quarter * 3, 1)
        label = '本季度'
        break
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1)
        label = '今年'
        break
      default:
        startDate = new Date(today)
    }

    const range: DateRange = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      label,
    }

    onDateRangeChange(range)
    return range
  }

  const handlePresetClick = (type: string) => {
    setSelectedRange(type)
    setShowCustom(false)
    getDateRange(type)
  }

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onDateRangeChange({
        startDate: customStart,
        endDate: customEnd,
        label: '自定义',
      })
      setSelectedRange('custom')
    }
  }

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow p-4">
      <FiCalendar className="w-5 h-5 text-gray-600" />

      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'today', label: '今天' },
          { value: 'week', label: '本周' },
          { value: 'month', label: '本月' },
          { value: 'quarter', label: '本季度' },
          { value: 'year', label: '今年' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => handlePresetClick(option.value)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedRange === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}

        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            selectedRange === 'custom'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          自定义
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-300">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <span className="text-gray-500">至</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <button
            onClick={handleCustomApply}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            应用
          </button>
        </div>
      )}
    </div>
  )
}
