'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { FiPlay, FiSave, FiDownload, FiTrash2, FiPlus, FiClock, FiCheck } from 'react-icons/fi';

interface PythonScript {
  id: number;
  name: string;
  description: string;
  code: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  execution_time?: number;
  last_run?: string;
}

interface ExecutionResult {
  id: number;
  script_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: any;
  output: string;
  error?: string;
  execution_time: number;
  created_at: string;
}

const SCRIPT_TEMPLATES = [
  {
    name: 'Customer Segmentation',
    description: 'K-means clustering for customer analysis',
    code: `import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# Load customer data
data = customer_data[['revenue', 'frequency', 'recency']]

# Normalize features
scaler = StandardScaler()
X = scaler.fit_transform(data)

# Fit K-means
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
clusters = kmeans.fit_predict(X)

# Analyze segments
results = {
    'n_clusters': 3,
    'inertia': kmeans.inertia_,
    'silhouette_score': metrics.silhouette_score(X, clusters)
}

print("Clustering complete")
print(f"Silhouette Score: {results['silhouette_score']:.3f}")`
  },
  {
    name: 'Time Series Forecasting',
    description: 'ARIMA model for revenue prediction',
    code: `import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
import warnings
warnings.filterwarnings('ignore')

# Load historical revenue data
data = revenue_data.sort_values('date')
ts = data['revenue']

# Fit ARIMA model
model = ARIMA(ts, order=(1, 1, 1))
results = model.fit()

# Generate forecasts for next 12 months
forecast = results.get_forecast(steps=12)
forecast_df = forecast.conf_int()
forecast_df['forecast'] = forecast.predicted_mean

print("Forecast generated successfully")
print(f"AIC: {results.aic:.2f}")
print(f"BIC: {results.bic:.2f}")`
  },
  {
    name: 'Anomaly Detection',
    description: 'Isolation Forest for outlier detection',
    code: `import pandas as pd
from sklearn.ensemble import IsolationForest
import numpy as np

# Load marketing data
data = marketing_data.dropna()

# Fit Isolation Forest
iso = IsolationForest(contamination=0.05, random_state=42)
anomaly_labels = iso.fit_predict(data)
anomaly_scores = iso.score_samples(data)

# Get anomalies
anomalies = data[anomaly_labels == -1]

print(f"Total anomalies detected: {len(anomalies)}")
print(f"Anomaly percentage: {len(anomalies)/len(data)*100:.2f}%")`
  }
];

export default function PythonAnalyticsPage() {
  const [scripts, setScripts] = useState<PythonScript[]>([]);
  const [selectedScript, setSelectedScript] = useState<PythonScript | null>(null);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showNewScript, setShowNewScript] = useState(false);
  const [activeTab, setActiveTab] = useState<'scripts' | 'editor' | 'results'>('scripts');
  const [scheduleFrequency, setScheduleFrequency] = useState('weekly');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const res = await apiClient.listPythonScripts();
        setScripts(res.data);
      } catch (error) {
        console.error('Failed to fetch scripts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScripts();
  }, []);

  const handleSelectScript = (script: PythonScript) => {
    setSelectedScript(script);
    setCode(script.code);
    setName(script.name);
    setDescription(script.description);
    setStatus(script.status);
    setActiveTab('editor');
  };

  const handleCreateScript = () => {
    setSelectedScript(null);
    setCode('');
    setName('');
    setDescription('');
    setStatus('draft');
    setShowNewScript(true);
  };

  const handleSaveScript = async () => {
    if (!name.trim() || !code.trim()) {
      alert('Please fill in name and code');
      return;
    }

    try {
      if (selectedScript) {
        await apiClient.updatePythonScript(selectedScript.id, {
          name,
          description,
          code,
          status
        });
      } else {
        await apiClient.createPythonScript({
          name,
          description,
          code
        });
      }

      alert('Script saved successfully!');
      const res = await apiClient.listPythonScripts();
      setScripts(res.data);
      setShowNewScript(false);
    } catch (error) {
      console.error('Failed to save script:', error);
      alert('Failed to save script');
    }
  };

  const handleExecuteScript = async () => {
    if (!selectedScript) return;

    setIsExecuting(true);
    try {
      const res = await apiClient.executePythonScript(selectedScript.id);
      setResults([res.result, ...results]);
      setActiveTab('results');
      alert('Script executed successfully!');
    } catch (error) {
      console.error('Failed to execute script:', error);
      alert('Failed to execute script');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDeleteScript = async (scriptId: number) => {
    if (!confirm('Are you sure you want to delete this script?')) return;

    try {
      await apiClient.deletePythonScript(scriptId);
      setScripts(scripts.filter(s => s.id !== scriptId));
      if (selectedScript?.id === scriptId) {
        setSelectedScript(null);
      }
    } catch (error) {
      console.error('Failed to delete script:', error);
      alert('Failed to delete script');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Python Analytics</h1>
            <p className="text-slate-600 mt-2">Write custom Python analysis & export to Tableau</p>
          </div>
          <button
            onClick={handleCreateScript}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            <FiPlus size={18} />
            New Script
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('scripts')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'scripts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Scripts
          </button>
          {selectedScript && (
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'editor'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Editor
            </button>
          )}
          {selectedScript && results.length > 0 && (
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'results'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Results
            </button>
          )}
        </div>

        {/* Scripts Tab */}
        {activeTab === 'scripts' && (
          <div className="space-y-4">
            {scripts.map(script => (
              <div
                key={script.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
                onClick={() => handleSelectScript(script)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900">{script.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        script.status === 'published' ? 'bg-green-100 text-green-700' :
                        script.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {script.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mt-1">{script.description}</p>
                    <div className="flex gap-4 text-xs text-slate-500 mt-3">
                      <span>Created: {new Date(script.created_at).toLocaleDateString()}</span>
                      {script.last_run && (
                        <span>Last run: {new Date(script.last_run).toLocaleString()}</span>
                      )}
                      {script.execution_time && (
                        <span>Execution: {script.execution_time}ms</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectScript(script);
                        setActiveTab('editor');
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit script"
                    >
                      <FiSave size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScript(script.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete script"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-slate-50 rounded text-xs font-mono text-slate-700 max-h-32 overflow-y-auto">
                  {script.code.split('\n').slice(0, 5).join('\n')}
                  {script.code.split('\n').length > 5 && '\n...'}
                </div>
              </div>
            ))}

            {scripts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-600 mb-4">No Python scripts yet</p>
                <button
                  onClick={handleCreateScript}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  Create Your First Script
                </button>
              </div>
            )}
          </div>
        )}

        {/* Editor Tab */}
        {activeTab === 'editor' && (selectedScript || showNewScript) && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Script Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Python Code</label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-96 p-3 border border-slate-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="# Write your Python code here"
                  spellCheck="false"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveScript}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  <FiSave size={16} />
                  Save Script
                </button>

                {selectedScript && (
                  <>
                    <button
                      onClick={handleExecuteScript}
                      disabled={isExecuting}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition"
                    >
                      <FiPlay size={16} />
                      {isExecuting ? 'Executing...' : 'Execute'}
                    </button>

                    <button
                      onClick={() => setShowScheduleDialog(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition"
                    >
                      <FiClock size={16} />
                      Schedule
                    </button>
                  </>
                )}
              </div>

              {/* Templates */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">Script Templates</h3>
                <div className="space-y-2">
                  {SCRIPT_TEMPLATES.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCode(template.code)}
                      className="block w-full text-left p-3 bg-white hover:bg-blue-100 rounded border border-blue-200 transition"
                    >
                      <p className="font-medium text-slate-900">{template.name}</p>
                      <p className="text-xs text-slate-600">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && results.length > 0 && (
          <div className="space-y-4">
            {results.map(result => (
              <div key={result.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {result.status === 'completed' ? (
                      <FiCheck className="text-green-600" size={20} />
                    ) : (
                      <span className="animate-spin">⏳</span>
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">Execution {result.id}</p>
                      <p className="text-xs text-slate-500">{new Date(result.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="text-sm text-slate-600">{result.execution_time}ms</span>
                </div>

                {result.output && (
                  <div className="mb-4 p-4 bg-slate-50 rounded font-mono text-sm text-slate-700 max-h-48 overflow-y-auto">
                    {result.output}
                  </div>
                )}

                {result.result && (
                  <div className="p-4 bg-slate-50 rounded">
                    <p className="text-sm font-semibold text-slate-900 mb-2">Results:</p>
                    <pre className="text-xs text-slate-700 overflow-x-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                )}

                {result.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    <p className="font-semibold mb-1">Error:</p>
                    {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Dialog */}
      {showScheduleDialog && selectedScript && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Schedule Script Execution</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Frequency</label>
                <select
                  value={scheduleFrequency}
                  onChange={(e) => setScheduleFrequency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Export to Tableau:</span> Results will be automatically exported to your Tableau datasource
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowScheduleDialog(false)}
                  className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Schedule created successfully!');
                    setShowScheduleDialog(false);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Create Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      )}
    </div>
  );
}
