'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import IssueAnalyzer from '../../components/IssueAnalyzer';

export default function RepoDetail() {
  const [repoData, setRepoData] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [fileStructure, setFileStructure] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [currentPath, setCurrentPath] = useState('');
  const [activeTab, setActiveTab] = useState<'files' | 'issues'>('files');
  const [issueFilter, setIssueFilter] = useState<'all' | 'critical' | 'security' | 'performance'>('all');
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get('url');

  const parseGitHubUrl = (url: string) => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    return { owner: match[1], repo: match[2].replace('.git', '') };
  };

  useEffect(() => {
    if (!repoUrl) return;
    
    const fetchData = async () => {
      setLoading(true);
      
      try {
        const { owner, repo } = parseGitHubUrl(repoUrl);
        
        // Fetch repo details
        const repoResponse = await fetch(`/api/repo?url=${repoUrl}&type=details`);
        const repoInfo = await repoResponse.json();
        setRepoData(repoInfo);
        
        // Fetch file structure
        const structureResponse = await fetch(`/api/repo?url=${repoUrl}&type=structure`);
        const structure = await structureResponse.json();
        setFileStructure(Array.isArray(structure) ? structure : []);
        
        // Fetch issues
        const issuesResponse = await fetch(`/api/repo?url=${repoUrl}&type=issues`);
        const issuesData = await issuesResponse.json();
        setIssues(Array.isArray(issuesData) ? issuesData : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIssues([]);
        setFileStructure([]);
      }
      
      setLoading(false);
    };
    
    fetchData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [repoUrl]);

  const handleFileClick = async (item: any) => {
    if (item.type === 'file') {
      const response = await fetch(`/api/repo?url=${repoUrl}&type=file&path=${item.path}`);
      const fileData = await response.json();
      setSelectedFile(fileData);
    } else if (item.type === 'dir') {
      const response = await fetch(`/api/repo?url=${repoUrl}&type=structure&path=${item.path}`);
      const structure = await response.json();
      setFileStructure(Array.isArray(structure) ? structure : []);
      setCurrentPath(item.path);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading repository details...</div>;
  }

  if (!repoData) {
    return <div className="p-8 text-center text-red-500">Failed to load repository</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Header */}
      <header className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/30 dark:border-gray-700/30 sticky top-0 z-50 shadow-sm">
        <div className="max-w-8xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => window.history.back()}
                className="group flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back</span>
              </button>
              
              <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                {repoData && (
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      {repoData.owner?.login}/{repoData.name}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-4">
                      <span className="flex items-center">
                        <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                        {repoData.language || 'Multiple'}
                      </span>
                      <span>⭐ {repoData.stargazers_count || 0}</span>
                      <span>🍴 {repoData.forks_count || 0}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Live</span>
              </div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm">
                Share
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-8xl mx-auto px-6 lg:px-8 py-8">

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-2">
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveTab('files')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'files'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v2z" />
                </svg>
                <span>Files</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === 'files' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {fileStructure.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('issues')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'issues'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Issues</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === 'issues' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {issues.length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'files' && (
          <div className={`grid gap-6 ${selectedFile ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1'}`}>
            {/* File Structure */}
            <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 ${selectedFile ? 'lg:col-span-1' : 'col-span-1'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  File Explorer
                </h2>
                {currentPath && (
                  <button
                    onClick={() => {
                      setCurrentPath('');
                      const response = fetch(`/api/repo?url=${repoUrl}&type=structure`)
                        .then(res => res.json())
                        .then(data => setFileStructure(Array.isArray(data) ? data : []));
                    }}
                    className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                  >
                    ← Root
                  </button>
                )}
              </div>
              
              {/* Current Path */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v2z" />
                  </svg>
                  <div className="font-mono flex items-center">
                    <button
                      onClick={() => {
                        setCurrentPath('');
                        fetch(`/api/repo?url=${repoUrl}&type=structure`)
                          .then(res => res.json())
                          .then(data => setFileStructure(Array.isArray(data) ? data : []));
                      }}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      /
                    </button>
                    {currentPath.split('/').filter(Boolean).map((segment, index, array) => {
                      const pathToSegment = array.slice(0, index + 1).join('/');
                      return (
                        <span key={index} className="flex items-center">
                          <button
                            onClick={() => {
                              setCurrentPath(pathToSegment);
                              fetch(`/api/repo?url=${repoUrl}&type=structure&path=${pathToSegment}`)
                                .then(res => res.json())
                                .then(data => setFileStructure(Array.isArray(data) ? data : []));
                            }}
                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          >
                            {segment}
                          </button>
                          {index < array.length - 1 && <span className="mx-1">/</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {fileStructure
                  .sort((a, b) => {
                    if (a.type === 'dir' && b.type !== 'dir') return -1;
                    if (a.type !== 'dir' && b.type === 'dir') return 1;
                    return a.name.localeCompare(b.name);
                  })
                  .map((item) => (
                  <div
                    key={item.name}
                    onClick={() => handleFileClick(item)}
                    className="group flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer transition-all duration-200"
                  >
                    <div className="flex-shrink-0">
                      {item.type === 'dir' ? (
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900 dark:text-white font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                        {currentPath ? `${currentPath}/${item.name}` : item.name}
                      </div>
                    </div>
                    {item.type === 'dir' && (
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* File Content */}
            {selectedFile && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 lg:col-span-3">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {selectedFile.name}
                    </h2>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-mono">{selectedFile.path}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Close</span>
                  </button>
                </div>
                
                <div className="relative">
                  <div className="absolute top-3 right-3 z-10">
                    <div className="px-2 py-1 bg-gray-800/80 text-gray-300 rounded text-xs font-mono">
                      {selectedFile.content?.split('\n').length || 0} lines
                    </div>
                  </div>
                  <pre className="bg-gray-900 dark:bg-gray-950 text-green-400 p-6 rounded-xl overflow-auto max-h-96 text-sm font-mono border border-gray-700">
                    <code>{selectedFile.content}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'issues' && (
          <IssueAnalyzer repoUrl={repoUrl} issues={issues} filter={issueFilter} onFilterChange={setIssueFilter} />
        )}
      </main>
    </div>
  );
}