import { Outlet, Link, useLocation } from 'react-router';
import { useAuth } from "@/react-app/auth/AuthProvider";
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  Calendar, 
  Clock, 
  FileText, 
  DollarSign, 
  Settings,
  LogOut,
  Scale,
  Search,
  Bell,
  MessageSquare
} from 'lucide-react';
import NotificationPanel from './NotificationPanel';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Matters', href: '/matters', icon: FolderOpen },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Deadlines', href: '/deadlines', icon: Clock },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Communications', href: '/communications', icon: MessageSquare },
  { name: 'Billing', href: '/billing', icon: DollarSign },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    fetchUnreadNotificationCount();
  }, []);

  const fetchUnreadNotificationCount = async () => {
    try {
      const response = await fetch('/api/notifications/count', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadNotificationCount(data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-10 right-10 w-64 h-64 bg-cyan-500/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-violet-500/8 rounded-full blur-3xl"></div>
      </div>
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white/8 backdrop-blur-xl shadow-2xl border-r border-white/10">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-6 border-b border-white/10">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-b from-gray-300 via-gray-200 to-gray-100 border-2 border-gray-400 rounded-lg flex items-center justify-center shadow-lg relative overflow-hidden">
                  {/* Marble texture effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-300/30 to-gray-400/20"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-gray-400/10 via-transparent to-gray-300/10"></div>
                  <Scale className="w-6 h-6 text-gray-700 relative z-10 drop-shadow-sm" />
                  {/* Roman pillar accent */}
                  <div className="absolute top-0 left-1 w-0.5 h-full bg-gradient-to-b from-gray-500/40 to-gray-400/20"></div>
                  <div className="absolute top-0 right-1 w-0.5 h-full bg-gradient-to-b from-gray-500/40 to-gray-400/20"></div>
                </div>
                {/* Roman laurel accent */}
                <div className="absolute -top-1 -right-1 w-4 h-4 text-gray-600">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                    <path d="M12 2C11 2 10 2.5 10 3.5C10 4 10.2 4.4 10.5 4.7C9.8 5.1 9 6 9 7.5C9 8.3 9.3 9 9.8 9.5C9.3 10 9 10.7 9 11.5C9 13 9.8 13.9 10.5 14.3C10.2 14.6 10 15 10 15.5C10 16.5 11 17 12 17C13 17 14 16.5 14 15.5C14 15 13.8 14.6 13.5 14.3C14.2 13.9 15 13 15 11.5C15 10.7 14.7 10 14.2 9.5C14.7 9 15 8.3 15 7.5C15 6 14.2 5.1 13.5 4.7C13.8 4.4 14 4 14 3.5C14 2.5 13 2 12 2Z"/>
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent logo-text">
                  Jusivo
                </span>
                <div className="text-xs text-blue-200 font-medium">Version 1.0</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-blue-100 hover:text-white hover:bg-white/10 hover:shadow-sm'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-blue-300 group-hover:text-blue-100'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center space-x-3 mb-4">
              <img
                className="w-10 h-10 rounded-xl shadow-md"
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent((user as any)?.name || (user as any)?.email || 'User')}&background=3b82f6&color=fff&size=64`}
                alt="Profile"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((user as any)?.name || (user as any)?.email || 'User')}&background=3b82f6&color=fff&size=64`;
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {(user as any)?.name || (user as any)?.email || 'User'}
                </p>
                <p className="text-xs text-blue-200 truncate">{(user as any)?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2.5 text-sm text-blue-100 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 hover:shadow-sm"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        {/* Top bar */}
        <div className="bg-white/8 backdrop-blur-xl shadow-sm border-b border-white/10 px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
                <input
                  type="text"
                  placeholder="Search matters, clients, documents..."
                  className="w-full pl-12 pr-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200 shadow-sm hover:shadow-md"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/intake/new"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-100 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 hover:shadow-sm border border-white/20 backdrop-blur-sm"
              >
                <Users className="w-4 h-4 mr-2" />
                New Intake
              </Link>
              <div className="relative">
                <button 
                  onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                  className="relative p-3 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-medium text-white bg-red-500 rounded-full ring-2 ring-white shadow-sm">
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </span>
                  )}
                </button>
                
                <NotificationPanel
                  isOpen={notificationPanelOpen}
                  onClose={() => setNotificationPanelOpen(false)}
                  unreadCount={unreadNotificationCount}
                  onUnreadCountChange={setUnreadNotificationCount}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-white/5 backdrop-blur-sm px-6 py-4 mt-8">
          <div className="flex items-center justify-between text-sm text-blue-200">
            <div className="flex items-center space-x-4">
              <span>Jusivo Case Manager Version 1.0</span>
              <span>•</span>
              <span>By Matthew R. Ray</span>
            </div>
            <div>
              © 2025 Matthew R. Ray - All Rights Reserved
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
