import React, { useEffect, useState, useCallback } from 'react';
import { getMyTimetableApi } from '../../api/timetable.api';
import ChildSelector from '../../components/parent/ChildSelector';
import PageHeader from '../../components/layout/PageHeader';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import { Clock, MapPin, User, Calendar } from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ChildTimetable = () => {
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [childrenTimetables, setChildrenTimetables] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getCurrentDay = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return WEEKDAYS.includes(today) ? today : 'Monday';
  };

  const [activeTab, setActiveTab] = useState(getCurrentDay());

  const fetchTimetables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyTimetableApi();
      if (res.success) {
        setChildrenTimetables(res.data || {});
      } else {
        setError(res.message || 'Failed to load timetables.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimetables();
  }, [fetchTimetables]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Child Class Timetable" description="Weekly lecture schedule and room allocations" />
        <LoadingTable rows={5} cols={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Child Class Timetable" description="Weekly lecture schedule and room allocations" />
        <ErrorState message={error} onRetry={fetchTimetables} />
      </div>
    );
  }

  const selectedReport = childrenTimetables[selectedChildId] || (Object.keys(childrenTimetables).length > 0 ? childrenTimetables[Object.keys(childrenTimetables)[0]] : null);
  const childTimetable = selectedReport?.timetable || {};
  const currentSlots = childTimetable[activeTab] || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Child Class Timetable"
          description="View weekly subject schedules, lecture times, and classroom numbers for your child"
        />
        <ChildSelector
          selectedChildId={selectedChildId}
          onSelectChild={(c) => setSelectedChildId(c.student_id || c.id)}
        />
      </div>

      {/* Weekday Tabs */}
      <div className="flex space-x-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
        {WEEKDAYS.map((day) => {
          const count = (childTimetable[day] || []).length;
          const isToday = day === getCurrentDay();
          return (
            <button
              key={day}
              onClick={() => setActiveTab(day)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === day
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>{day}</span>
              {isToday && <span className="w-2 h-2 rounded-full bg-primary-600"></span>}
              {count > 0 && <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-[10px] text-slate-700">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Slots */}
      <div className="space-y-4">
        {currentSlots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentSlots.map((slot) => (
              <div key={slot.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 text-xs font-bold font-mono">
                    {slot.start_time} - {slot.end_time}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">Lec #{slot.lecture_number || '1'}</span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{slot.subject_name}</h4>
                  <p className="text-xs font-semibold text-slate-400">{slot.subject_code}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{slot.teacher_name || 'Teacher'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">Room: {slot.room_number || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Classes Scheduled for {activeTab}</h4>
            <p className="text-xs text-slate-400">No active lecture periods found for this weekday.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildTimetable;
