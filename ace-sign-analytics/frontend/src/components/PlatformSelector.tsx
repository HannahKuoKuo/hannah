import { FiFilter } from 'react-icons/fi'

interface PlatformSelectorProps {
  selectedPlatforms: string[]
  onPlatformChange: (platforms: string[]) => void
}

const PLATFORMS = [
  { id: 'meta', label: 'Meta (社媒)', color: 'bg-blue-100 text-blue-700' },
  { id: 'email', label: 'MailerLite (邮件)', color: 'bg-purple-100 text-purple-700' },
  { id: 'ga4', label: 'GA4 (网站)', color: 'bg-orange-100 text-orange-700' },
]

export default function PlatformSelector({
  selectedPlatforms,
  onPlatformChange,
}: PlatformSelectorProps) {
  const togglePlatform = (platformId: string) => {
    const updated = selectedPlatforms.includes(platformId)
      ? selectedPlatforms.filter((p) => p !== platformId)
      : [...selectedPlatforms, platformId]
    onPlatformChange(updated.length === 0 ? ['meta', 'email', 'ga4'] : updated)
  }

  const handleSelectAll = () => {
    onPlatformChange(['meta', 'email', 'ga4'])
  }

  const handleClearAll = () => {
    onPlatformChange(['meta', 'email', 'ga4'])
  }

  return (
    <div className="flex items-center gap-4 bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-2">
        <FiFilter className="w-5 h-5 text-gray-600" />
        <span className="font-medium text-gray-900">监测平台:</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.id}
            onClick={() => togglePlatform(platform.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedPlatforms.includes(platform.id)
                ? platform.color
                : 'bg-gray-100 text-gray-600 opacity-50'
            }`}
          >
            {platform.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 ml-auto">
        <button
          onClick={handleSelectAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          全选
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={handleClearAll}
          className="text-sm text-gray-600 hover:text-gray-700 font-medium"
        >
          全不选
        </button>
      </div>
    </div>
  )
}
