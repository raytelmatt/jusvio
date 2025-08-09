import { useAuth } from "@/react-app/auth/AuthProvider";
import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AuthCallbackPage() {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      // Check for error parameters from OAuth provider
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      if (errorParam) {
        setError(errorDescription || `OAuth error: ${errorParam}`);
        return;
      }

      // Check if we have an authorization code
      const code = searchParams.get('code');
      if (!code) {
        setError('No authorization code received from Google. Please try signing in again.');
        return;
      }

      try {
        await refreshUser();
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Failed to complete sign in. Please try again.');
      }
    };

    handleAuth();
  }, [refreshUser, searchParams]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    
    try {
      await refreshUser();
    } catch (err) {
      console.error('Retry auth error:', err);
      setError('Sign in failed again. Please go back to the login page and try once more.');
    } finally {
      setIsRetrying(false);
    }
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
          <div className="w-full max-w-md">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl text-center">
              <div className="mb-6">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Sign In Error</h1>
                <p className="text-red-200 text-sm leading-relaxed">{error}</p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </>
                  )}
                </button>
                
                <a
                  href="/login"
                  className="block w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 border border-white/20"
                >
                  Back to Login
                </a>
              </div>
              
              <div className="mt-6 text-xs text-blue-200/70">
                If this problem persists, please clear your browser cookies and try again.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
            <div className="absolute inset-0 w-12 h-12 rounded-full bg-blue-400/20 animate-ping"></div>
          </div>
          <div className="text-center">
            <p className="text-white text-lg font-medium mb-2">Completing sign in...</p>
            <p className="text-blue-200 text-sm">Please wait while we verify your credentials</p>
          </div>
        </div>
      </div>
    </div>
  );
}
