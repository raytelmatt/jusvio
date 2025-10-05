import React, { useState, useEffect } from 'react';

interface NetworkStatusProps {
  onRetry?: () => void;
}

export default function NetworkStatus({ onRetry }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNetworkError, setShowNetworkError] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNetworkError(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNetworkError(true);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for network errors in console (ERR_BLOCKED_BY_CLIENT, etc.)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('ERR_BLOCKED_BY_CLIENT') || 
          message.includes('Network connectivity issue') ||
          message.includes('ERR_NETWORK_CHANGED')) {
        setShowNetworkError(true);
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      console.error = originalConsoleError;
    };
  }, []);

  const handleRetry = () => {
    setShowNetworkError(false);
    if (onRetry) {
      onRetry();
    } else {
      // Default retry - reload the page
      window.location.reload();
    }
  };

  if (!showNetworkError && isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Network Connectivity Issue
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                {!isOnline 
                  ? "You're currently offline. Please check your internet connection."
                  : "Unable to connect to the database. This may be caused by:"
                }
              </p>
              {isOnline && (
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Ad blocker blocking Firebase requests</li>
                  <li>Corporate firewall restrictions</li>
                  <li>Browser extension interference</li>
                  <li>DNS resolution issues</li>
                </ul>
              )}
            </div>
            <div className="mt-4">
              <div className="flex space-x-3">
                <button
                  type="button"
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={handleRetry}
                >
                  Retry
                </button>
                <button
                  type="button"
                  className="bg-white px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => setShowNetworkError(false)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
