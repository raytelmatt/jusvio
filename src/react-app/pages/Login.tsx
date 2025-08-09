import { useAuth } from "@/react-app/auth/AuthProvider";
import { Navigate } from 'react-router';
import { Scale, Users, FileText, Calendar } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
  const { user, loginWithEmailPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/" replace />;
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
        <div className="w-full max-w-lg">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl relative">
            {/* Shimmer effect (non-interactive overlay) */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse pointer-events-none"></div>
            
            <div className="text-center mb-8 relative">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-b from-amber-200 via-amber-100 to-white rounded-2xl mb-6 shadow-2xl shadow-amber-500/20 border-2 border-amber-300/30 overflow-hidden">
                {/* Marble texture effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-50/40 to-amber-200/20"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-300/15 via-transparent to-amber-100/10"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-white/30 via-transparent to-amber-200/10"></div>
                
                {/* Roman column accents */}
                <div className="absolute top-0 left-2 w-1 h-full bg-gradient-to-b from-amber-400/50 via-amber-300/30 to-amber-200/20"></div>
                <div className="absolute top-0 right-2 w-1 h-full bg-gradient-to-b from-amber-400/50 via-amber-300/30 to-amber-200/20"></div>
                
                <Scale className="w-10 h-10 text-amber-800 relative z-10 drop-shadow-md" />
                
                {/* Roman laurel wreath accent */}
                <div className="absolute -top-2 -right-2 w-6 h-6 text-amber-700/80">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                    <path d="M12 2C11 2 10 2.5 10 3.5C10 4 10.2 4.4 10.5 4.7C9.8 5.1 9 6 9 7.5C9 8.3 9.3 9 9.8 9.5C9.3 10 9 10.7 9 11.5C9 13 9.8 13.9 10.5 14.3C10.2 14.6 10 15 10 15.5C10 16.5 11 17 12 17C13 17 14 16.5 14 15.5C14 15 13.8 14.6 13.5 14.3C14.2 13.9 15 13 15 11.5C15 10.7 14.7 10 14.2 9.5C14.7 9 15 8.3 15 7.5C15 6 14.2 5.1 13.5 4.7C13.8 4.4 14 4 14 3.5C14 2.5 13 2 12 2Z"/>
                  </svg>
                </div>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent logo-text whitespace-nowrap">
                Jusivo Case Manager
              </h1>
              <div className="text-blue-200 text-sm font-medium mb-1">Version 1.0</div>
              <div className="text-blue-300 text-xs mb-3">By Matthew R. Ray</div>
              <p className="text-blue-100 text-lg font-medium">Comprehensive Legal Case Management</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <a href="/client-portal" className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 hover:bg-white/10 transition-all duration-300 block">
                <Users className="w-6 h-6 text-blue-300 mx-auto mb-2" />
                <p className="text-sm text-blue-100 font-medium">Client Portal</p>
              </a>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 hover:bg-white/10 transition-all duration-300">
                <FileText className="w-6 h-6 text-purple-300 mx-auto mb-2" />
                <p className="text-sm text-blue-100 font-medium">Case Files</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 hover:bg-white/10 transition-all duration-300">
                <Calendar className="w-6 h-6 text-green-300 mx-auto mb-2" />
                <p className="text-sm text-blue-100 font-medium">Court Calendar</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 hover:bg-white/10 transition-all duration-300">
                <Scale className="w-6 h-6 text-yellow-300 mx-auto mb-2" />
                <p className="text-sm text-blue-100 font-medium">Smart Billing</p>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setIsLoading(true);
                try {
                  await loginWithEmailPassword(email.trim(), password);
                } catch (err) {
                  console.error(err);
                  setError("Invalid email or password");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-blue-200 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm text-blue-200 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <div className="text-red-300 text-sm">{error}</div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              >
                <span className="flex items-center justify-center">
                  <Scale className="w-5 h-5 mr-2" />
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </span>
              </button>
            </form>

            <div className="mt-8 text-center space-y-4">
              <div className="space-y-3">
                <p className="text-blue-100 text-sm font-medium mb-3">
                  Criminal Defense • Personal Injury • SSD Cases
                </p>
                <div className="flex flex-col space-y-2">
                  <a 
                    href="/intake/new" 
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-200 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 border border-white/20"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    General Case Intake
                  </a>
                  <a 
                    href="/intake/criminal" 
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-red-200 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-all duration-200 border border-red-400/30"
                  >
                    <Scale className="w-4 h-4 mr-2" />
                    Criminal Defense Intake
                  </a>
                </div>
              </div>
              <div className="text-xs text-blue-200/70 border-t border-white/10 pt-4">
                © 2025 Matthew R. Ray - All Rights Reserved
              </div>
            </div>
          </div>

          {/* Additional decorative elements */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-400/20 rounded-full blur-sm"></div>
          <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-purple-400/20 rounded-full blur-sm"></div>
        </div>
      </div>
    </div>
  );
}
