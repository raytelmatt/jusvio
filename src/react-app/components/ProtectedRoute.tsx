import { useAuth } from "@/react-app/auth/AuthProvider";
import { Navigate } from 'react-router';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isPending, authError } = useAuth();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="flex flex-col items-center space-y-4 bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-blue-200">Checking authentication...</p>
          {authError && (
            <div className="text-red-300 text-sm text-center max-w-md">
              <p className="mb-2">Authentication Error:</p>
              <p className="text-xs opacity-80">{authError}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
