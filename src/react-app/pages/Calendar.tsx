import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Hearing {
  id: number;
  matter_id: number;
  matter_title: string;
  client_name: string;
  hearing_type: string;
  start_at: string;
  end_at: string;
  courtroom: string;
  judge_or_alj: string;
  court_name?: string;
  is_ssa_hearing: boolean;
  practice_area: string;
}

export default function Calendar() {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>('');

  useEffect(() => {
    fetchHearings();
  }, [currentDate, selectedPracticeArea]);

  const fetchHearings = async () => {
    try {
      const params = new URLSearchParams();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0).toISOString();
      
      params.append('start', startOfMonth);
      params.append('end', endOfMonth);
      if (selectedPracticeArea) {
        params.append('practice_area', selectedPracticeArea);
      }

      const response = await fetch(`/api/hearings?${params.toString()}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setHearings(data);
      }
    } catch (error) {
      console.error('Error fetching hearings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getHearingsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return hearings.filter(hearing => {
      const hearingDate = new Date(hearing.start_at).toISOString().split('T')[0];
      return hearingDate === dateStr;
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const practiceAreaColors = {
    Criminal: 'bg-red-100 text-red-800 border-red-200',
    PersonalInjury: 'bg-blue-100 text-blue-800 border-blue-200',
    SSD: 'bg-green-100 text-green-800 border-green-200',
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        </div>
        <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-7 gap-4">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="h-20 bg-white/20 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="text-blue-200">Court hearings and appointments</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPracticeArea}
            onChange={(e) => setSelectedPracticeArea(e.target.value)}
            className="px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
          >
            <option value="" className="bg-slate-800 text-white">All Practice Areas</option>
            <option value="Criminal" className="bg-slate-800 text-white">Criminal Defense</option>
            <option value="PersonalInjury" className="bg-slate-800 text-white">Personal Injury</option>
            <option value="SSD" className="bg-slate-800 text-white">Social Security Disability</option>
          </select>
          <Link
            to="/hearings/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Schedule Hearing
          </Link>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10">
        <div className="px-6 py-4 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-white/10 rounded-lg text-blue-200 hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-white">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-white/10 rounded-lg text-blue-200 hover:text-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-sm border border-white/20 rounded-lg hover:bg-white/10 text-blue-100 backdrop-blur-sm"
              >
                Today
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-px bg-white/20 rounded-lg overflow-hidden">
            {/* Day headers */}
            {dayNames.map((day) => (
              <div key={day} className="bg-white/10 backdrop-blur-sm px-3 py-2 text-center">
                <span className="text-xs font-medium text-blue-200 uppercase">
                  {day}
                </span>
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => {
              const dayHearings = getHearingsForDate(day);
              const isToday = day && day.toDateString() === new Date().toDateString();
              const isCurrentMonth = day && day.getMonth() === currentDate.getMonth();
              
              return (
                <div
                  key={index}
                  className={`bg-white/5 backdrop-blur-sm min-h-[120px] p-2 ${
                    !isCurrentMonth ? 'opacity-40' : ''
                  } ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-blue-300' : 'text-white'
                      }`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayHearings.slice(0, 2).map((hearing) => (
                          <Link
                            key={hearing.id}
                            to={`/matters/${hearing.matter_id}`}
                            className={`block text-xs p-1 rounded border ${
                              practiceAreaColors[hearing.practice_area as keyof typeof practiceAreaColors]
                            } hover:shadow-sm transition-shadow`}
                          >
                            <div className="font-medium truncate">
                              {formatTime(hearing.start_at)} {hearing.hearing_type}
                            </div>
                            <div className="truncate opacity-75">
                              {hearing.client_name}
                            </div>
                          </Link>
                        ))}
                        {dayHearings.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayHearings.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Hearings List */}
      <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10">
        <div className="px-6 py-4 border-b border-white/20">
          <h3 className="text-lg font-semibold text-white">Upcoming Hearings</h3>
        </div>
        <div className="divide-y divide-white/10">
          {hearings
            .filter(hearing => new Date(hearing.start_at) >= new Date())
            .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
            .slice(0, 10)
            .map((hearing) => (
              <div key={hearing.id} className="p-6 hover:bg-white/5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link
                        to={`/matters/${hearing.matter_id}`}
                        className="text-lg font-medium text-white hover:text-blue-300"
                      >
                        {hearing.hearing_type}
                      </Link>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        practiceAreaColors[hearing.practice_area as keyof typeof practiceAreaColors]
                      }`}>
                        {hearing.practice_area === 'PersonalInjury' ? 'PI' : hearing.practice_area}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-blue-200">
                      <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 text-blue-300" />
                        {new Date(hearing.start_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-blue-300" />
                        {formatTime(hearing.start_at)}
                        {hearing.end_at && ` - ${formatTime(hearing.end_at)}`}
                      </div>
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-blue-300" />
                        {hearing.client_name}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-blue-300" />
                        {hearing.courtroom || 'TBD'}
                      </div>
                    </div>
                    {hearing.judge_or_alj && (
                      <div className="mt-2 text-sm text-blue-200">
                        {hearing.is_ssa_hearing ? 'ALJ' : 'Judge'}: {hearing.judge_or_alj}
                      </div>
                    )}
                  </div>
                  <Link
                    to={`/matters/${hearing.matter_id}`}
                    className="ml-4 inline-flex items-center px-3 py-1.5 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                  >
                    View Matter
                  </Link>
                </div>
              </div>
            ))}
          {hearings.filter(hearing => new Date(hearing.start_at) >= new Date()).length === 0 && (
            <div className="p-12 text-center text-blue-200">
              No upcoming hearings scheduled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
