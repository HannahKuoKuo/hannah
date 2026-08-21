'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { FiLoader, FiRefreshCw, FiHeart, FiMessageSquare, FiShare2 } from 'react-icons/fi';

interface Post {
  id: number;
  platform: string;
  caption: string;
  published_at: string;
  likes: number;
  comments: number;
  shares: number;
}

export default function SocialPage() {
  const [metaPosts, setMetaPosts] = useState<Post[]>([]);
  const [linkedinPosts, setLinkedinPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchSocialData();
  }, []);

  const fetchSocialData = async () => {
    try {
      setLoading(true);
      const [metaData, linkedinData] = await Promise.all([
        apiClient.getMetaPosts(),
        apiClient.getLinkedinPosts()
      ]);

      setMetaPosts(metaData.data);
      setLinkedinPosts(linkedinData.data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load social data');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await Promise.all([apiClient.syncMeta(), apiClient.syncLinkedin()]);
      await fetchSocialData();
      toast.success('Social data synced!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FiLoader className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  const allPosts = [...metaPosts, ...linkedinPosts].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Social Media</h1>
          <p className="text-slate-600 mt-1">Monitor your social media engagement</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <FiRefreshCw className={syncing ? 'animate-spin' : ''} />
          Sync
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-600 text-sm font-medium">Total Posts</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{allPosts.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-600 text-sm font-medium">Total Engagement</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {allPosts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-600 text-sm font-medium">Avg. Engagement</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {allPosts.length > 0
              ? Math.round(
                  allPosts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0) /
                    allPosts.length
                )
              : 0}
          </p>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-lg shadow">
        {allPosts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Post
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">
                    <div className="flex items-center justify-center gap-1">
                      <FiHeart size={16} />
                      Likes
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">
                    <div className="flex items-center justify-center gap-1">
                      <FiMessageSquare size={16} />
                      Comments
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">
                    <div className="flex items-center justify-center gap-1">
                      <FiShare2 size={16} />
                      Shares
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                    Published
                  </th>
                </tr>
              </thead>
              <tbody>
                {allPosts.map((post) => (
                  <tr key={`${post.platform}-${post.id}`} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">
                      <div className="max-w-md truncate">{post.caption}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                        {post.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-slate-900 font-medium">
                      {post.likes || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-slate-900 font-medium">
                      {post.comments || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-slate-900 font-medium">
                      {post.shares || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(post.published_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FiShare2 className="text-4xl text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No social posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
