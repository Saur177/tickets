'use client';

import { useState } from 'react';

export default function RepoExtractor() {
  const [repoUrl, setRepoUrl] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  const fetchData = async (type: string, path = '') => {
    if (!repoUrl) return;
    setLoading(true);
    const params = new URLSearchParams({ url: repoUrl, type, path });
    const response = await fetch(`/api/repo?${params}`);
    const result = await response.json();
    setData(result);
    setLoading(false);
  };

  const handleFileClick = (item: any) => {
    if (item.type === 'file') {
      fetchData('file', item.path);
    } else if (item.type === 'dir') {
      setCurrentPath(item.path);
      fetchData('structure', item.path);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Enter GitHub repository URL"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors"
        />
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => fetchData('details')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Get Details
          </button>
          <button 
            onClick={() => fetchData('structure')}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            File Structure
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-4 text-gray-600 dark:text-gray-400">Loading...</div>}

      {data && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 transition-colors">
          {Array.isArray(data) ? (
            <div>
              <h3 className="font-bold mb-3 text-gray-900 dark:text-white">
                File Structure {currentPath && `- ${currentPath}`}
              </h3>
              <div className="grid gap-2">
                {data.map((item: any) => (
                  <div
                    key={item.name}
                    onClick={() => handleFileClick(item)}
                    className="flex items-center gap-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                  >
                    <span className="text-sm">
                      {item.type === 'dir' ? '📁' : '📄'}
                    </span>
                    <span className="text-gray-900 dark:text-white">{item.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({item.type})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : data.content ? (
            <div>
              <h3 className="font-bold mb-3 text-gray-900 dark:text-white">File: {data.name}</h3>
              <pre className="bg-gray-900 dark:bg-gray-950 text-green-400 p-4 rounded overflow-auto max-h-96 text-sm">
                {data.content}
              </pre>
            </div>
          ) : (
            <div>
              <h3 className="font-bold mb-3 text-gray-900 dark:text-white">Repository Details</h3>
              <div className="grid gap-2 text-sm">
                <p className="text-gray-700 dark:text-gray-300"><strong>Name:</strong> {data.name}</p>
                <p className="text-gray-700 dark:text-gray-300"><strong>Description:</strong> {data.description}</p>
                <p className="text-gray-700 dark:text-gray-300"><strong>Language:</strong> {data.language}</p>
                <p className="text-gray-700 dark:text-gray-300"><strong>Stars:</strong> {data.stargazers_count}</p>
                <p className="text-gray-700 dark:text-gray-300"><strong>Forks:</strong> {data.forks_count}</p>
                <p className="text-gray-700 dark:text-gray-300"><strong>Created:</strong> {new Date(data.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}