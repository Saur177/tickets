'use client';

import { useState } from 'react';

interface GitHubFile {
  content: string;
  sha: string;
  path: string;
}

interface GitHubIssue {
  id: number;
  title: string;
  body: string;
  state: string;
  user: { login: string };
}

export default function GitHubFetcher() {
  const [data, setData] = useState<GitHubFile | GitHubIssue[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchFile = async (owner: string, repo: string, path: string) => {
    setLoading(true);
    const response = await fetch(`/api/github?owner=${owner}&repo=${repo}&path=${path}&type=file`);
    const file = await response.json();
    setData(file);
    setLoading(false);
  };

  const fetchIssues = async (owner: string, repo: string) => {
    setLoading(true);
    const response = await fetch(`/api/github?owner=${owner}&repo=${repo}&type=issues`);
    const issues = await response.json();
    setData(issues);
    setLoading(false);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <button 
          onClick={() => fetchFile('facebook', 'react', 'README.md')}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          Fetch React README
        </button>
        <button 
          onClick={() => fetchIssues('facebook', 'react')}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          Fetch React Issues
        </button>
      </div>
      
      {loading && <p className="text-gray-600 dark:text-gray-400">Loading...</p>}
      {data && (
        <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg overflow-auto max-h-96 text-sm transition-colors">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}