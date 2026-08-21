'use client';

import { useEffect } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <FiAlertTriangle className="text-red-600" size={32} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Oops! Something went wrong
        </h1>

        <p className="text-slate-600 mb-4">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>

        {error.digest && (
          <div className="bg-slate-100 rounded p-3 mb-4 text-xs text-slate-600 break-all">
            <p className="font-mono">Error ID: {error.digest}</p>
          </div>
        )}

        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          <FiRefreshCw size={16} />
          Try Again
        </button>

        <a
          href="/dashboard"
          className="block mt-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
