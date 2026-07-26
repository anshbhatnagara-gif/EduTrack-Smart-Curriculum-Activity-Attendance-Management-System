import React, { useEffect, useState, useCallback } from 'react';
import { getAnnouncementsApi } from '../../api/announcement.api';
import PageHeader from '../../components/layout/PageHeader';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import { Megaphone, Search, Filter } from 'lucide-react';

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAnnouncementsApi();
      if (res.success) {
        setAnnouncements(res.data || []);
      } else {
        setError(res.message || 'Failed to load announcements.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const filtered = announcements.filter((a) => {
    const matchesSearch =
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.message?.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || a.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="School & Class Announcements" description="Broadcast notices, official advisories, and classroom updates" />
        <LoadingTable rows={6} cols={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="School & Class Announcements" description="Broadcast notices, official advisories, and classroom updates" />
        <ErrorState message={error} onRetry={fetchAnnouncements} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="School & Class Announcements"
        description="Official school broadcasts, academic notices, and class updates published by your teachers and school administration"
      />

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-xs font-semibold px-3 py-2 border border-slate-300 rounded-xl focus:outline-none bg-white"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="normal">Normal Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((a) => (
            <div key={a.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    a.priority === 'high'
                      ? 'bg-rose-100 text-rose-800'
                      : a.priority === 'low'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {a.priority || 'Normal'} Priority
                </span>
                <span className="text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{a.message}</p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
                <span>By: {a.author_name || 'Administration'}</span>
                <span>Target: {a.target_role?.toUpperCase() || 'ALL'}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
            <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Announcements Found</h4>
            <p className="text-xs text-slate-400">No broadcast notices match your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnnouncements;
