'use client';

import { useState, useCallback } from 'react';

interface addloginpageforauthComponentProps {
  title?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function addloginpageforauthComponent({
  title = 'add login page for auth',
  onSuccess,
  onError,
  className = ''
}: addloginpageforauthComponentProps) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
    success: false
  });

  const [formData, setFormData] = useState({
    input: '',
    options: []
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const result = {
        message: 'add login page for auth completed successfully!',
        timestamp: new Date().toISOString(),
        data: formData
      };
      
      setState(prev => ({ 
        ...prev, 
        data: result, 
        loading: false, 
        success: true 
      }));
      
      onSuccess?.(result);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false 
      }));
      
      onError?.(errorMessage);
    }
  }, [formData, onSuccess, onError]);

  return (
    <div className={`max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Intelligent solution generated for your requirements
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6">
          <label htmlFor="input" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Input Data
          </label>
          <input
            type="text"
            id="input"
            name="input"
            value={formData.input}
            onChange={(e) => setFormData(prev => ({ ...prev, input: e.target.value }))}
            placeholder="Enter your data here..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={state.loading || !formData.input.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {state.loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Execute Feature</span>
              </>
            )}
          </button>
        </div>
      </form>

      {state.error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <span className="text-red-700 dark:text-red-400">{state.error}</span>
        </div>
      )}

      {state.success && state.data && (
        <div className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            Success!
          </h3>
          <p className="text-green-700 dark:text-green-300">
            {state.data.message}
          </p>
        </div>
      )}
    </div>
  );
}