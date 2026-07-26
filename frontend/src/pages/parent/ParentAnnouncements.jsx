import React, { useEffect, useState, useCallback } from 'react';
import { getAnnouncementsApi } from '../../api/announcement.api';
import PageHeader from '../../components/layout/PageHeader';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import { Megaphone, Search } from 'lucide-react';

const ParentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

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

  const filtered = announcements.filter(
    (a) =>
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.message?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="School & Guardian Advisories" description="Official school broadcasts and parent notices" />
        <LoadingTable rows={5} cols={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="School & Guardian Advisories" description="Official school broadcasts and parent notices" />
        <ErrorState message={error} onRetry={fetchAnnouncements} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="School & Guardian Advisories"
        description="Official broadcasts, holiday notices, and administrative communications for guardians"
      />

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

      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((a) => (
            <div key={a.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-100 text-indigo-800">
                  {a.priority || 'Normal'} Priority
                </span>
                <span className="text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{a.message}</p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
                <span>Publisher: {a.author_name || 'Administration'}</span>
                <span>Scope: {a.target_role?.toUpperCase() || 'ALL'}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
            <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Announcements Found</h4>
            <p className="text-xs text-slate-400">No advisories match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentAnnouncements;
