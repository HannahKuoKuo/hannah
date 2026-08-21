'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSend, FiX, FiLoader, FiCalendar, FiFilter } from 'react-icons/fi';

interface ContentItem {
  id: number;
  title: string;
  description: string;
  content: string;
  platforms: string[];
  scheduled_date: string;
  media_urls?: string[];
  hashtags?: string;
  status: 'scheduled' | 'published' | 'failed';
  created_at: string;
  published_at?: string;
}

const PLATFORMS = ['Instagram', 'Facebook', 'LinkedIn', 'Twitter'];

export default function ContentCalendarPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    platforms: [] as string[],
    scheduled_date: '',
    media_urls: '',
    hashtags: ''
  });

  useEffect(() => {
    fetchContent();
  }, [selectedStatus]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const status = selectedStatus === 'all' ? undefined : selectedStatus;
      const data = await apiClient.getContentCalendar(50, 0, status);
      setContents(data.data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (content?: ContentItem) => {
    if (content) {
      setEditingId(content.id);
      setFormData({
        title: content.title,
        description: content.description,
        content: content.content,
        platforms: content.platforms,
        scheduled_date: content.scheduled_date,
        media_urls: content.media_urls?.join(',') || '',
        hashtags: content.hashtags || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        content: '',
        platforms: [],
        scheduled_date: '',
        media_urls: '',
        hashtags: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content || !formData.scheduled_date || formData.platforms.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        ...formData,
        media_urls: formData.media_urls ? formData.media_urls.split(',').map(url => url.trim()) : [],
      };

      if (editingId) {
        await apiClient.updateContent(editingId, payload);
        toast.success('Content updated successfully!');
      } else {
        await apiClient.createContent(payload);
        toast.success('Content scheduled successfully!');
      }

      handleCloseModal();
      fetchContent();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save content');
    }
  };

  const handlePublish = async (contentId: number) => {
    try {
      await apiClient.publishContent(contentId);
      toast.success('Content published successfully!');
      fetchContent();
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish content');
    }
  };

  const handleDelete = async (contentId: number) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      await apiClient.deleteContent(contentId);
      toast.success('Content deleted');
      fetchContent();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete content');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredContents = selectedStatus === 'all'
    ? contents
    : contents.filter(c => c.status === selectedStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FiLoader className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Content Calendar</h1>
          <p className="text-slate-600 mt-1">Schedule and manage your content across platforms</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus />
          New Content
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex items-center gap-2">
        <FiFilter className="text-slate-600" />
        <div className="flex gap-2">
          {['all', 'scheduled', 'published', 'failed'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      <div className="grid gap-6">
        {filteredContents.length > 0 ? (
          filteredContents.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm">{item.description}</p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {item.status === 'scheduled' && (
                    <button
                      onClick={() => handlePublish(item.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                    >
                      <FiSend size={16} />
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>

              <p className="text-slate-700 mb-4 line-clamp-2">{item.content}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-slate-600 font-medium mb-1">Platforms</p>
                  <div className="flex flex-wrap gap-2">
                    {item.platforms.map(platform => (
                      <span key={platform} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-slate-600 font-medium mb-1">Scheduled Date</p>
                  <div className="flex items-center gap-2 text-slate-700">
                    <FiCalendar size={16} />
                    {new Date(item.scheduled_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {item.hashtags && (
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Tags:</span> {item.hashtags}
                </div>
              )}

              {item.media_urls && item.media_urls.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-600 mb-2">Media ({item.media_urls.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {item.media_urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs truncate max-w-xs"
                      >
                        Media {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FiCalendar className="mx-auto text-4xl text-slate-300 mb-4" />
            <p className="text-slate-600">No content scheduled yet</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingId ? 'Edit Content' : 'Schedule New Content'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-500 hover:text-slate-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter content title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Scheduled Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Brief description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={5}
                  placeholder="Enter your content here"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Platforms *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {PLATFORMS.map(platform => (
                    <label key={platform} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.platforms.includes(platform)}
                        onChange={() => handlePlatformToggle(platform)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <span className="text-slate-700">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hashtags
                </label>
                <input
                  type="text"
                  value={formData.hashtags}
                  onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="#hashtag1 #hashtag2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Media URLs (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.media_urls}
                  onChange={(e) => setFormData({ ...formData, media_urls: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {editingId ? 'Update Content' : 'Schedule Content'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
