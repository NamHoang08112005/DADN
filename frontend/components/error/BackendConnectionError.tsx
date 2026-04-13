'use client';

import React, { useState, useEffect } from 'react';
import { getBackendHealthStatus, getErrorMessage, formatHealthStatus } from '@/lib/backendHealth';

interface BackendConnectionErrorProps {
  onRetry?: () => void;
  showDebugInfo?: boolean;
}

export default function BackendConnectionError({
  onRetry,
  showDebugInfo = true,
}: BackendConnectionErrorProps) {
  const [health, setHealth] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      const healthStatus = await getBackendHealthStatus();
      setHealth(healthStatus);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    handleCheck();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 rounded-full p-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Error Title */}
        <h2 className="text-2xl font-bold text-center text-red-600 mb-2">
          Connection Error
        </h2>

        {/* Error Message */}
        <p className="text-center text-gray-600 mb-6">
          {health && getErrorMessage(health)}
        </p>

        {/* Status Details */}
        {health && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Backend Server:</span>
              <span
                className={`font-semibold ${
                  health.isBackendRunning ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {health.isBackendRunning ? '✓ Running' : '✗ Offline'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Adafruit IO:</span>
              <span
                className={`font-semibold ${
                  health.isAdafruitConnected ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {health.isAdafruitConnected ? '✓ Connected' : '✗ Disconnected'}
              </span>
            </div>
          </div>
        )}

        {/* Troubleshooting Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Troubleshooting:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Make sure the backend is running: <code className="bg-white px-1 rounded">fastapi dev main.py</code></li>
            <li>Check your internet connection</li>
            <li>Verify Adafruit IO credentials in .env file</li>
            <li>Check if port 8000 is available</li>
          </ol>
        </div>

        {/* Debug Info Button */}
        {showDebugInfo && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-left text-xs text-gray-500 hover:text-gray-700 mb-4 p-2 rounded hover:bg-gray-100"
          >
            {showDetails ? '▼' : '▶'} Show Debug Info
          </button>
        )}

        {/* Debug Details */}
        {showDetails && health && (
          <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs mb-4 overflow-auto max-h-40">
            {formatHealthStatus(health)}
          </pre>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCheck}
            disabled={isChecking}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isChecking ? 'Checking...' : 'Retry Connection'}
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Reload Page
            </button>
          )}
        </div>

        {/* Footer Info */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Backend URL: http://127.0.0.1:8000
        </p>
      </div>
    </div>
  );
}
