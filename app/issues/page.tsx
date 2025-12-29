export default function Issues() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Issues</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage and resolve repository issues with AI assistance</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Scan Repository
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">All Issues</button>
          <button className="px-4 py-2 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg">Critical</button>
          <button className="px-4 py-2 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg">Security</button>
          <button className="px-4 py-2 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg">Code Quality</button>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border-l-4 border-red-500">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">Critical</span>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded">Security</span>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Auto-Fix</button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">SQL Injection Vulnerability</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">Potential SQL injection found in user input handling. This could allow attackers to execute malicious SQL queries.</p>
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>File: auth/login.py:45</span>
              <span>Detected: 2 hours ago</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border-l-4 border-yellow-500">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">Warning</span>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded">Code Quality</span>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Auto-Fix</button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unused Import Statement</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">Import statement for 'datetime' is not used in this file. Consider removing to improve code cleanliness.</p>
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>File: utils/helpers.py:12</span>
              <span>Detected: 4 hours ago</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border-l-4 border-orange-500">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded">Medium</span>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded">Performance</span>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Details</button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Inefficient Database Query</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">N+1 query problem detected. Consider using select_related() or prefetch_related() to optimize database access.</p>
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>File: models/user.py:78</span>
              <span>Detected: 6 hours ago</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">Info</span>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded">Style</span>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Auto-Fix</button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Code Formatting Issue</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">Line length exceeds 80 characters. Consider breaking into multiple lines for better readability.</p>
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>File: core/processor.py:128</span>
              <span>Detected: 1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}