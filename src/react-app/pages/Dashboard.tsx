import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { 
  Users, 
  FolderOpen, 
  Calendar, 
  Clock, 
  DollarSign, 
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  BarChart3,
  Target
} from 'lucide-react';
import type { DashboardStats } from '@/shared/types';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  color: string;
  href?: string;
  trend?: number;
}

function StatCard({ title, value, icon: Icon, color, href, trend }: StatCardProps) {
  const content = (
    <div className={`bg-white/8 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-6 hover:shadow-2xl hover:bg-white/12 transition-all duration-300 hover:scale-[1.02] group`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-200 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">+{trend}% this month</span>
            </div>
          )}
        </div>
        <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );

  return href ? <Link to={href}>{content}</Link> : content;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/8 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-white/20 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <Sparkles className="w-6 h-6 text-blue-300" />
          </div>
          <p className="text-blue-200 mt-1">Welcome back to Jusivo Case Manager Version 1.0</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/clients/new"
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Link>
          <Link
            to="/matters/new"
            className="inline-flex items-center px-6 py-3 border border-white/20 text-sm font-semibold rounded-xl text-blue-100 bg-white/10 backdrop-blur-sm hover:bg-white/20 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Matter
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Criminal Cases"
          value={stats?.open_matters_by_practice.Criminal || 0}
          icon={FolderOpen}
          color="bg-gradient-to-br from-red-500 to-red-600"
          href="/matters?practice_area=Criminal"
          trend={12}
        />
        <StatCard
          title="Personal Injury Cases"
          value={stats?.open_matters_by_practice.PersonalInjury || 0}
          icon={Target}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          href="/matters?practice_area=PersonalInjury"
          trend={8}
        />
        <StatCard
          title="SSD Cases"
          value={stats?.open_matters_by_practice.SSD || 0}
          icon={BarChart3}
          color="bg-gradient-to-br from-green-500 to-green-600"
          href="/matters?practice_area=SSD"
          trend={15}
        />
        <StatCard
          title="Upcoming Hearings"
          value={stats?.upcoming_hearings || 0}
          icon={Calendar}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          href="/calendar"
        />
        <StatCard
          title="Due This Week"
          value={stats?.deadlines_7_days || 0}
          icon={Clock}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          href="/deadlines"
        />
        <StatCard
          title="Unpaid Invoices"
          value={stats?.unpaid_invoices || 0}
          icon={DollarSign}
          color="bg-gradient-to-br from-yellow-500 to-yellow-600"
          href="/billing"
        />
      </div>

      {/* Today's Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Schedule */}
        <div className="bg-white/8 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-6 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Today's Schedule</h2>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-4 animate-pulse"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Arraignment - State v. Johnson</p>
                <p className="text-xs text-blue-200 mt-1">9:00 AM - Courtroom 3A</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-4 animate-pulse"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Client Meeting - Personal Injury Consultation</p>
                <p className="text-xs text-blue-200 mt-1">2:00 PM - Conference Room</p>
              </div>
            </div>
            <div className="text-center py-4">
              <Link to="/calendar" className="text-sm text-blue-300 hover:text-blue-100 font-medium hover:underline">
                View full calendar →
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/8 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-6 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center mr-3">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center p-4 hover:bg-white/10 rounded-xl transition-colors">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Motion filed in State v. Smith</p>
                <p className="text-xs text-blue-200 mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center p-4 hover:bg-gray-50/80 rounded-xl transition-colors">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">New client intake completed</p>
                <p className="text-xs text-blue-200 mt-1">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center p-4 hover:bg-gray-50/80 rounded-xl transition-colors">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Discovery deadline approaching</p>
                <p className="text-xs text-blue-200 mt-1">6 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/8 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-8 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <Link
            to="/intake/new"
            className="flex flex-col items-center p-6 text-center hover:bg-white/10 rounded-xl transition-all duration-200 hover:shadow-md group backdrop-blur-sm"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-blue-100 group-hover:text-white">New Intake</span>
          </Link>
          <Link
            to="/intake/criminal"
            className="flex flex-col items-center p-6 text-center hover:bg-white/10 rounded-xl transition-all duration-200 hover:shadow-md group backdrop-blur-sm"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-blue-100 group-hover:text-white">Criminal Intake</span>
          </Link>
          <Link
            to="/documents/generate"
            className="flex flex-col items-center p-6 text-center hover:bg-white/10 rounded-xl transition-all duration-200 hover:shadow-md group backdrop-blur-sm"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FolderOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-blue-100 group-hover:text-white">Generate Document</span>
          </Link>
          <Link
            to="/billing/invoice/new"
            className="flex flex-col items-center p-6 text-center hover:bg-white/10 rounded-xl transition-all duration-200 hover:shadow-md group backdrop-blur-sm"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-blue-100 group-hover:text-white">Create Invoice</span>
          </Link>
          <Link
            to="/deadlines/new"
            className="flex flex-col items-center p-6 text-center hover:bg-white/10 rounded-xl transition-all duration-200 hover:shadow-md group backdrop-blur-sm"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-blue-100 group-hover:text-white">Add Deadline</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
