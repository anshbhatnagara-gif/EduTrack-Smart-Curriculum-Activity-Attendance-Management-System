import React, { useEffect, useState, useCallback } from 'react';
import { getMyTimetableApi } from '../../api/timetable.api';
import PageHeader from '../../components/layout/PageHeader';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import { Clock, MapPin, BookOpen } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TeacherTimetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState('Monday');

  const fetchTimetable = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyTimetableApi();
      if (res.success) {
        setTimetable(res.data || []);
      } else {
        setError(res.message || 'Failed to load timetable.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Teaching Timetable" description="Weekly class schedule, lecture slots, and room locations" />
        <LoadingTable rows={5} cols={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Teaching Timetable" description="Weekly class schedule, lecture slots, and room locations" />
        <ErrorState message={error} onRetry={fetchTimetable} />
      </div>
    );
  }

  const daySlots = timetable.filter(
    (slot) => slot.day_of_week?.toLowerCase() === activeDay.toLowerCase()
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teaching Timetable"
        description="Weekly class schedule, lecture slots, and assigned classroom locations"
      />

      {/* Weekday Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeDay === day
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Slots for active day */}
      <div className="space-y-3">
        {daySlots.length > 0 ? (
          daySlots.map((slot, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm">
                  Lec {slot.lecture_number || idx + 1}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{slot.subject_name}</h4>
                  <p className="text-xs font-medium text-slate-500 flex items-center space-x-1 mt-0.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>{slot.class_name} - {slot.section_name}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-xs font-semibold text-slate-700">
                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-50 border">
                  <Clock className="w-4 h-4 text-primary-600" />
                  <span className="font-mono">{slot.start_time} - {slot.end_time}</span>
                </div>
                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-50 border">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>Room: {slot.room_number || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-2xl border text-center text-slate-500 text-sm font-medium">
            No lecture slots scheduled for {activeDay}.
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherTimetable;
