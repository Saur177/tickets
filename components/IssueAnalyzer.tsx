"use client";

import { useState, useEffect, useCallback } from "react";

interface AnalyzedIssue {
  id: number;
  title: string;
  body: string;
  state: string;
  user: { login: string };
  ai_analysis?: {
    criticality: "critical" | "high" | "medium" | "low";
    type:
      | "bug"
      | "security"
      | "feature"
      | "enhancement"
      | "documentation"
      | "performance";
    solution: string;
    priority: number;
  };
  ai_solution?: {
    solution: string;
    steps: string[];
    files_created: Array<{
      path: string;
      content: string;
      description: string;
    }>;
    files_modified: Array<{
      path: string;
      changes: string;
      description: string;
    }>;
    estimated_time: string;
  };
}

export default function IssueAnalyzer({
  repoUrl,
  issues,
  filter = "all",
  onFilterChange,
}: {
  repoUrl: string;
  issues: unknown[];
  filter?: string;
  onFilterChange?: (filter: string) => void;
}) {
  const [analyzedIssues, setAnalyzedIssues] = useState<AnalyzedIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<AnalyzedIssue | null>(null);
  const [generatingSolution, setGeneratingSolution] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [committing, setCommitting] = useState(false);

  const analyzeIssues = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issues, repoContext: repoUrl }),
      });
      const data = await response.json();
      setAnalyzedIssues(data.issues);
    } catch (error) {
      console.error("AI analysis failed:", error);
      setAnalyzedIssues(issues as AnalyzedIssue[]);
    }
    setLoading(false);
  }, [issues, repoUrl]);

  const generateAISolution = useCallback(async (issueId: number) => {
    setGeneratingSolution(issueId);
    try {
      const issue = analyzedIssues.find(i => i.id === issueId);
      if (!issue) return;

      const response = await fetch('/api/ai-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          issue: {
            title: issue.title,
            body: issue.body,
            ai_analysis: issue.ai_analysis
          },
          repoContext: repoUrl 
        })
      });
      
      const data = await response.json();
      
      setAnalyzedIssues(prev => prev.map(i => 
        i.id === issueId 
          ? { ...i, ai_solution: data.solution }
          : i
      ));
      
      if (selectedIssue?.id === issueId) {
        setSelectedIssue(prev => prev ? { ...prev, ai_solution: data.solution } : null);
      }
    } catch (error) {
      console.error('AI solution generation failed:', error);
    }
    setGeneratingSolution(null);
  }, [analyzedIssues, repoUrl, selectedIssue]);

  const commitToGitHub = useCallback(async (issue: AnalyzedIssue) => {
    if (!issue.ai_solution) return;
    
    setCommitting(true);
    try {
      const commitMessage = `AI Solution: ${issue.title}\n\n${issue.ai_solution.solution}\n\nImplementation includes:\n${issue.ai_solution.steps.map(step => `- ${step}`).join('\n')}`;
      
      const response = await fetch('/api/github-commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          files: [...(issue.ai_solution.files_created || []), ...(issue.ai_solution.files_modified || [])],
          commitMessage,
          issueTitle: issue.title
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Success! Pull request created: ${result.pullRequest.url}`);
        // Open the pull request in a new tab
        window.open(result.pullRequest.url, '_blank');
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Commit error:', error);
      alert('❌ Failed to commit to GitHub. Please check your connection and try again.');
    }
    setCommitting(false);
  }, [repoUrl]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startY === 0 || window.scrollY > 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    if (distance > 0) {
      setPullDistance(Math.min(distance, 120));
      if (distance > 80) {
        e.preventDefault();
      }
    }
  }, [startY]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 80 && !refreshing) {
      setRefreshing(true);
      analyzeIssues().finally(() => {
        setRefreshing(false);
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  }, [pullDistance, refreshing, analyzeIssues]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    if (issues.length > 0) {
      const timeoutId = setTimeout(() => {
        analyzeIssues();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [issues, analyzeIssues]);

  const getFilteredIssues = useCallback(() => {
    if (filter === "all") return analyzedIssues;

    return analyzedIssues.filter(
      (issue) =>
        issue.ai_analysis?.criticality === filter ||
        issue.ai_analysis?.type === filter
    );
  }, [analyzedIssues, filter]);

  const getAvailableFilters = useCallback(() => {
    const criticalities = new Set<string>();
    const types = new Set<string>();

    analyzedIssues.forEach((issue) => {
      if (issue.ai_analysis?.criticality) {
        criticalities.add(issue.ai_analysis.criticality);
      }
      if (issue.ai_analysis?.type) {
        types.add(issue.ai_analysis.type);
      }
    });

    return {
      criticalities: Array.from(criticalities),
      types: Array.from(types),
    };
  }, [analyzedIssues]);

  const { criticalities, types } = getAvailableFilters();

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case "critical":
        return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700";
      case "high":
        return "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700";
      case "low":
        return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700";
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "bug":
        return "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400";
      case "security":
        return "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400";
      case "feature":
        return "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400";
      case "performance":
        return "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400";
      case "documentation":
        return "bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400";
      case "enhancement":
        return "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400";
      default:
        return "bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          AI is analyzing issues...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      
      {/* Enhanced Header with Stats */}
      <div className="bg-gradient-to-br from-white/90 to-blue-50/80 dark:from-gray-800/90 dark:to-gray-900/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                AI Issue Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {analyzedIssues.length} issues analyzed • {getFilteredIssues().length} showing
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                AI-Powered Analysis
              </span>
            </div>
            <button
              onClick={analyzeIssues}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Re-analyze
            </button>
          </div>
        </div>

        {/* Enhanced Filter Section */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-gray-700/30">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onFilterChange?.("all")}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                filter === "all"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
                  : "bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:shadow-md"
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7l-7 7-7-7m14 18l-7-7-7 7" />
                </svg>
                <span>All Issues ({analyzedIssues.length})</span>
              </span>
            </button>

            {/* Enhanced Criticality Filters */}
            {criticalities.map((criticality) => {
              const count = analyzedIssues.filter(issue => issue.ai_analysis?.criticality === criticality).length;
              return (
                <button
                  key={criticality}
                  onClick={() => onFilterChange?.(criticality)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 capitalize ${
                    filter === criticality
                      ? `bg-gradient-to-r shadow-lg ${
                          criticality === "critical"
                            ? "from-red-600 to-red-700 text-white shadow-red-500/25"
                            : criticality === "high"
                            ? "from-orange-600 to-orange-700 text-white shadow-orange-500/25"
                            : criticality === "medium"
                            ? "from-yellow-600 to-yellow-700 text-white shadow-yellow-500/25"
                            : "from-green-600 to-green-700 text-white shadow-green-500/25"
                        }`
                      : `bg-white/80 dark:bg-gray-700/80 border hover:shadow-md ${
                          criticality === "critical"
                            ? "text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                            : criticality === "high"
                            ? "text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            : criticality === "medium"
                            ? "text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                            : "text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
                        }`
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      criticality === "critical" ? "bg-red-500" :
                      criticality === "high" ? "bg-orange-500" :
                      criticality === "medium" ? "bg-yellow-500" : "bg-green-500"
                    }`}></div>
                    <span>{criticality} ({count})</span>
                  </span>
                </button>
              );
            })}

            {/* Enhanced Type Filters */}
            {types.map((type) => {
              const count = analyzedIssues.filter(issue => issue.ai_analysis?.type === type).length;
              const typeIcons = {
                bug: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
                security: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                feature: "M13 10V3L4 14h7v7l9-11h-7z",
                performance: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
                documentation: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                enhancement: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
              };
              return (
                <button
                  key={type}
                  onClick={() => onFilterChange?.(type)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 capitalize ${
                    filter === type
                      ? `bg-gradient-to-r shadow-lg ${
                          type === "security"
                            ? "from-purple-600 to-purple-700 text-white shadow-purple-500/25"
                            : type === "performance"
                            ? "from-indigo-600 to-indigo-700 text-white shadow-indigo-500/25"
                            : type === "bug"
                            ? "from-red-600 to-red-700 text-white shadow-red-500/25"
                            : type === "feature"
                            ? "from-blue-600 to-blue-700 text-white shadow-blue-500/25"
                            : "from-gray-600 to-gray-700 text-white shadow-gray-500/25"
                        }`
                      : `bg-white/80 dark:bg-gray-700/80 border hover:shadow-md ${
                          type === "security"
                            ? "text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            : type === "performance"
                            ? "text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                            : type === "bug"
                            ? "text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                            : type === "feature"
                            ? "text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            : "text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                        }`
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeIcons[type as keyof typeof typeIcons] || typeIcons.feature} />
                    </svg>
                    <span>{type} ({count})</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Enhanced Issues List */}
      <div className="bg-gradient-to-br from-white/90 to-gray-50/80 dark:from-gray-800/90 dark:to-gray-900/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 p-8">
        {getFilteredIssues().length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Issues Found
            </h4>
            <p className="text-gray-500 dark:text-gray-400">
              No issues match the selected filter criteria
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {getFilteredIssues().map((issue, index) => (
              <div
                key={issue.id}
                className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-2xl p-6 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => setSelectedIssue(issue)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {issue.title}
                      </h4>
                    </div>
                    
                    {issue.ai_analysis && (
                      <div className="flex flex-wrap gap-3 mb-4">
                        <span className={`px-4 py-2 rounded-full text-xs font-bold border-2 shadow-sm ${getCriticalityColor(issue.ai_analysis.criticality)}`}>
                          <span className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${
                              issue.ai_analysis.criticality === "critical" ? "bg-red-500" :
                              issue.ai_analysis.criticality === "high" ? "bg-orange-500" :
                              issue.ai_analysis.criticality === "medium" ? "bg-yellow-500" : "bg-green-500"
                            }`}></div>
                            <span>{issue.ai_analysis.criticality.toUpperCase()}</span>
                          </span>
                        </span>
                        <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm ${getTypeColor(issue.ai_analysis.type)}`}>
                          {issue.ai_analysis.type.toUpperCase()}
                        </span>
                        <span className="px-4 py-2 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm">
                          Priority: {issue.ai_analysis.priority}/10
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                      issue.state === "open"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                        : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800"
                    }`}>
                      {issue.state.toUpperCase()}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        by {issue.user?.login || "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>

                {issue.body && (
                  <div className="bg-gray-50/80 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50">
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {issue.body.substring(0, 200)}{issue.body.length > 200 ? "..." : ""}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Click to view details</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!issue.ai_solution && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          generateAISolution(issue.id);
                        }}
                        disabled={generatingSolution === issue.id}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-xs font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        {generatingSolution === issue.id ? (
                          <>
                            <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <span>Generate Solution</span>
                          </>
                        )}
                      </button>
                    )}
                    {issue.ai_solution && (
                      <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-lg border border-green-200 dark:border-green-800">
                        ✓ Solution Ready
                      </span>
                    )}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 dark:border-gray-700/30 animate-slideUp">
            <div className="flex items-start justify-between mb-8">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {selectedIssue.title}
                  </h3>
                </div>
                {selectedIssue.ai_analysis && (
                  <div className="flex flex-wrap gap-3">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 shadow-lg ${getCriticalityColor(selectedIssue.ai_analysis.criticality)}`}>
                      <span className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          selectedIssue.ai_analysis.criticality === "critical" ? "bg-red-500" :
                          selectedIssue.ai_analysis.criticality === "high" ? "bg-orange-500" :
                          selectedIssue.ai_analysis.criticality === "medium" ? "bg-yellow-500" : "bg-green-500"
                        }`}></div>
                        <span>{selectedIssue.ai_analysis.criticality.toUpperCase()}</span>
                      </span>
                    </span>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${getTypeColor(selectedIssue.ai_analysis.type)}`}>
                      {selectedIssue.ai_analysis.type.toUpperCase()}
                    </span>
                    <span className="px-4 py-2 rounded-full text-sm font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-lg">
                      Priority: {selectedIssue.ai_analysis.priority}/10
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors group"
              >
                <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-8">
              <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Issue Description</span>
                </h4>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedIssue.body || "No description provided"}
                  </p>
                </div>
              </div>

              {selectedIssue.ai_analysis && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>AI Analysis</span>
                  </h4>
                  <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/50 dark:border-gray-700/50 shadow-inner">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono leading-relaxed">
                      {selectedIssue.ai_analysis.solution}
                    </pre>
                  </div>
                </div>
              )}

              {selectedIssue.ai_solution ? (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200/50 dark:border-green-800/50">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>AI-Generated Solution</span>
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/50 dark:border-gray-700/50 shadow-inner">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Solution Overview</h5>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        {selectedIssue.ai_solution.solution}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Est. Time: {selectedIssue.ai_solution.estimated_time}</span>
                        </span>
                      </div>
                    </div>
                    
                    {selectedIssue.ai_solution.steps.length > 0 && (
                      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/50 dark:border-gray-700/50 shadow-inner">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Implementation Steps</h5>
                        <ol className="space-y-2">
                          {selectedIssue.ai_solution.steps.map((step, index) => (
                            <li key={index} className="flex items-start space-x-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span className="text-gray-700 dark:text-gray-300">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    
                    {selectedIssue.ai_solution.files_created && selectedIssue.ai_solution.files_created.length > 0 && (
                      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/50 dark:border-gray-700/50 shadow-inner">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Files Created ({selectedIssue.ai_solution.files_created.length})</span>
                        </h5>
                        <div className="space-y-4">
                          {selectedIssue.ai_solution.files_created.map((file, index) => (
                            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-sm text-blue-600 dark:text-blue-400">{file.path}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">NEW</span>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(file.content)}
                                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                                  >
                                    Copy Code
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{file.description}</p>
                              <div className="bg-gray-50 dark:bg-gray-900/50 rounded p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">File Content:</span>
                                  <span className="text-xs text-gray-500">Create this file manually in your project</span>
                                </div>
                                <pre className="text-xs overflow-x-auto">
                                  <code className="text-gray-700 dark:text-gray-300">{file.content}</code>
                                </pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedIssue.ai_solution.files_modified && selectedIssue.ai_solution.files_modified.length > 0 && (
                      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/50 dark:border-gray-700/50 shadow-inner">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Files Modified ({selectedIssue.ai_solution.files_modified.length})</span>
                        </h5>
                        <div className="space-y-4">
                          {selectedIssue.ai_solution.files_modified.map((file, index) => (
                            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-sm text-blue-600 dark:text-blue-400">{file.path}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded">MODIFIED</span>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(file.changes)}
                                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                                  >
                                    Copy Changes
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{file.description}</p>
                              <div className="bg-gray-50 dark:bg-gray-900/50 rounded p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Changes to Apply:</span>
                                  <span className="text-xs text-gray-500">Apply these changes manually</span>
                                </div>
                                <pre className="text-xs overflow-x-auto">
                                  <code className="text-gray-700 dark:text-gray-300">{file.changes}</code>
                                </pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-800/50 text-center">
                  <div className="mb-4">
                    <svg className="w-12 h-12 text-purple-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Generate AI Solution</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Get a detailed, step-by-step solution for this issue using AI
                    </p>
                  </div>
                  <button
                    onClick={() => generateAISolution(selectedIssue.id)}
                    disabled={generatingSolution === selectedIssue.id}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {generatingSolution === selectedIssue.id ? (
                      <span className="flex items-center space-x-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Generating Solution...</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Generate AI Solution</span>
                      </span>
                    )}
                  </button>
                </div>
              )}
              
              {/* Commit Solution Button */}
              {selectedIssue.ai_solution && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-indigo-200/50 dark:border-indigo-800/50">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-indigo-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Commit Solution</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Automatically create a pull request with the AI-generated solution
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => {
                          // Copy all file contents to clipboard
                          const allContent = selectedIssue.ai_solution?.files_created
                            ?.map(file => `// ${file.path}\n${file.content}`)
                            .join('\n\n') || '';
                          navigator.clipboard.writeText(allContent);
                          alert('All solution files copied to clipboard!');
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <span className="flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy All Files</span>
                        </span>
                      </button>
                      <button
                        onClick={() => commitToGitHub(selectedIssue)}
                        disabled={committing}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="flex items-center space-x-2">
                          {committing ? (
                            <>
                              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>Committing...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                              </svg>
                              <span>Commit to GitHub</span>
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}